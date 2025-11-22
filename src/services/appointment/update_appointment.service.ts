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
                    // CORRECCIÓN IMPORTANTE: Usamos .lean()
                    // Esto devuelve un objeto JSON puro (POJO), asegurando que leemos el campo 'phone' 
                    // tal cual está en la base de datos.
                    const fixer = await User.findById(fixerId).lean();
                    const requester = await User.findById(requesterId).lean();

                    if (fixer && requester) {
                        // Debug: Mostramos qué datos exactos se recuperaron
                        console.log(`>>> 🔍 Datos recuperados de la BD con .lean():`);
                        // @ts-ignore
                        console.log(`   - Fixer (ID: ${fixer._id}): Phone=${fixer.phone}, Whatsapp=${fixer.whatsapp}`);
                        // @ts-ignore
                        console.log(`   - Requester (ID: ${requester._id}): Phone=${requester.phone}`);

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
        const result = await Appointment.findByIdAndUpdate(appointment_id, {
            cancelled_fixer: true
        }, {
            new: true
        });
        if (!result) {
            throw new Error("Appointment no econtrado");
        }
        const client = await User.findById(result.id_requester);
        
        // Buscamos al Fixer (Profesional)
        const fixer = await User.findById(result.id_fixer);

        // 3. ENVIAR NOTIFICACIÓN (Si encontramos los usuarios)
        if (client && fixer) {
            console.log(`[Cancelación] Iniciando notificación para la cita ${appointment_id}`);
            
            // Llamamos al servicio de notificaciones sin 'await' bloqueante si prefieres rapidez,
            // o con 'await' si quieres asegurar que se envíe antes de responder al front.
            // Aquí uso await para asegurar que se intente enviar.
            await notificationService.notifyAppointmentCancellation(
                result.current_requester_name, // Nombre usado en la reserva
                client.email,          // Email real del cliente (desde User)
                result.current_requester_phone, // Teléfono de la reserva
                fixer.name,            // Nombre del fixer (desde User)
                result.selected_date // Fecha de la cita
            );
        } else {
            console.warn(`[Warning] No se pudo notificar: Falta cliente (${!!client}) o fixer (${!!fixer}) en BD.`);
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