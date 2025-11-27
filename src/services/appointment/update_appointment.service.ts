import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import db_connection from '../../database.js';
import Appointment from '../../models/Appointment.js';
import { notificationService } from '../notifications/notification.service.js';
import { User } from '../../models/user.model.js';

dotenv.config();

let connected = false;

async function set_db_connection() {
    if (!connected) {
        await db_connection();
        connected = true;
    }
}

export async function update_appointment_by_id(id: string, attributes: Record<string, unknown>) {
    try {
        await set_db_connection();

        // 1. BUSCAMOS LA CITA ORIGINAL (Para tener la fecha vieja)
        const oldAppointment = await Appointment.findById(id);

        if (!oldAppointment) {
            throw new Error('Cita no encontrada');
        }

        const oldStartingTime = oldAppointment.starting_time;

        // 2. ACTUALIZAMOS LA CITA
        const updated_appointment = await Appointment.findByIdAndUpdate(
            id,
            { $set: attributes },
            { new: true },
        );

        if (updated_appointment) {

            // ============================================================
            // 3. LÓGICA DE NOTIFICACIÓN DE REPROGRAMACIÓN
            // ============================================================

            const newStartingTime = attributes.starting_time ? new Date(attributes.starting_time as string | Date) : null;
            const oldDateObj = new Date(oldStartingTime);

            const isReschedule = newStartingTime && newStartingTime.getTime() !== oldDateObj.getTime();

            if (isReschedule) {
                console.log(`>>> 🔄 Reprogramación detectada.`);
                
                // Usamos 'any' para leer los IDs de forma flexible
                const doc = updated_appointment as any;
                const fixerId = doc.id_fixer || doc.fixer_id || doc.fixer;
                const requesterId = doc.id_requester || doc.requester_id || doc.requester;

                if (!fixerId || !requesterId) {
                    console.error(">>> ❌ Error: No se encontraron IDs en la cita actualizada.", { fixerId, requesterId });
                } else {
                    const fixer = await User.findById(fixerId).lean();
                    const requester = await User.findById(requesterId).lean();

                    if (fixer && requester) {
                        try {
                            await notificationService.sendAppointmentRescheduleNotification(
                                fixer,
                                requester,
                                oldStartingTime,
                                updated_appointment
                            );
                            console.log(">>> 📨 Proceso de notificación finalizado.");
                        } catch (notifyError) {
                            console.error(">>> 🚨 Error al enviar notificación:", (notifyError as Error).message);
                        }
                    } else {
                        console.error(">>> ❌ Error: Usuario Fixer o Requester no encontrado en la BD.");
                    }
                }
            } else {
                if (attributes.starting_time) {
                    console.log(">>> ℹ️ Se actualizó la cita pero la fecha es idéntica.");
                }
            }

            return true;
        } else {
            return false;
        }
    } catch (err) {
        throw new Error((err as Error).message);
    }
}

export async function fixer_cancell_appointment_by_id(appointment_id: string) {
    try {
        await set_db_connection();

        // 1. VERIFICAR IDEMPOTENCIA
        // Antes de cancelar, verificamos si ya estaba cancelada para no duplicar eventos.
        const existing = await Appointment.findById(appointment_id);
        if (!existing) {
            throw new Error("Appointment no encontrado");
        }
        
        if (existing.cancelled_fixer) {
            console.warn(`[Info] La cita ${appointment_id} ya estaba cancelada por el fixer. Omitiendo proceso.`);
            return existing;
        }

        // 2. EJECUTAR CANCELACIÓN
        const result = await Appointment.findByIdAndUpdate(appointment_id, {
            cancelled_fixer: true
        }, {
            new: true
        });

        if (!result) {
            throw new Error("Error actualizando la cita");
        }
        
        // Obtenemos datos de usuarios
        const client = await User.findById(result.id_requester);
        const fixer = await User.findById(result.id_fixer);

        // 3. ENVIAR NOTIFICACIÓN AL CLIENTE (Aviso normal)
        if (client && fixer) {
            console.log(`[Cancelación] Iniciando notificación al cliente para la cita ${appointment_id}`);
            
            await notificationService.notifyAppointmentCancellation(
                result.current_requester_name, 
                client.email,           
                result.current_requester_phone, 
                fixer.name,             
                result.selected_date 
            );
        } else {
            console.warn(`[Warning] No se pudo notificar: Falta cliente (${!!client}) o fixer (${!!fixer}) en BD.`);
        }

        // ============================================================
        // 4. LÓGICA DE ALERTA DE MÚLTIPLES CANCELACIONES (HU)
        // ============================================================
        if (fixer) {
            const CANCELLATION_THRESHOLD = 3; 

            // Buscamos las últimas citas del fixer para ver la racha
            // Ordenamos por 'updatedAt' descendente para ver lo más reciente
            const recentAppointments = await Appointment.find({ 
                id_fixer: result.id_fixer 
            })
            .sort({ updatedAt: -1 }) 
            .limit(20); 

            let consecutiveCancellations = 0;

            // Contamos cuántas seguidas están canceladas por el fixer
            for (const app of recentAppointments) {
                if (app.cancelled_fixer) {
                    consecutiveCancellations++;
                } else {
                    // Si encontramos una NO cancelada (booked/completed), se rompe la racha
                    break;
                }
            }

            console.log(`[Alert System] Fixer ${fixer.name} tiene racha de ${consecutiveCancellations} cancelaciones.`);

            // Si supera el umbral, enviamos alerta
            if (consecutiveCancellations >= CANCELLATION_THRESHOLD) {
                // @ts-ignore: Acceso seguro a propiedad whatsapp si phone es nulo
                const fixerPhone = fixer.phone || fixer.whatsapp;
                
                // Si supera el umbral por 2 más (ej: 5 cancelaciones), escalamos
                const isEscalated = consecutiveCancellations >= (CANCELLATION_THRESHOLD + 2);

                await notificationService.notifyFixerExcessiveCancellations(
                    fixer._id,
                    fixer.name,
                    fixer.email,
                    fixerPhone,
                    consecutiveCancellations,
                    new Date(), // Fecha de la última cancelación (ahora)
                    isEscalated
                );
            }
        }

        return result;
    } catch (error) {
        throw new Error((error as Error).message);
    }
}

interface Availability {
    lunes: number[];
    martes: number[];
    miercoles: number[];
    jueves: number[];
    viernes: number[];
    sabado: number[];
    domingo: number[];
}

export async function update_fixer_availability(fixer_id: string, availability: Availability) {
    try {
        const db = mongoose.connection.db!;
        const result = await db.collection('users').updateOne(
            { _id: new mongoose.Types.ObjectId(fixer_id) },
            { $set: { availability: availability } }
        );
        return result;
    } catch (err) {
        throw new Error((err as Error).message);
    }
}