import * as dotenv from 'dotenv';
import db_connection from '../../database.js';
import Appointment from '../../models/Appointment.js'
import mongoose from 'mongoose';
import { notificationService } from '../notifications/notification.service.js';

dotenv.config();

let connected = false;

async function set_db_connection() {
    if (!connected) {
        await db_connection();
        connected = true;
    }
}

interface AppointmentParameter {
    id_fixer: string;
    id_requester: string;
    selected_date: Date;
    current_requester_name: string;
    appointment_type: 'virtual' | 'presential';
    appointment_description?: string;
    link_id?: string;
    current_requester_phone: string;
    starting_time: Date;
    finishing_time?: Date;
    schedule_state?: 'cancelled' | 'booked';
    display_location_name?: string;
    lat?: string;
    lon?: string;
    cancelled_fixer?: boolean;
    reprogram_reason?: string;
}

//Citas
// * Mantener endpoint Vale (revisar si existen fallas con el nuevo esquema de la db).
// * Existian incompatibilidades con el esquema modificado
// ? Asuntos modificados: Ya no se actualizan appointments existentes.
// ? Si ya existe un appointment con el mismo fixer, fecha y hora, se rechaza la creacion.
export async function create_appointment(current_appointment: AppointmentParameter) {
    try {
        await set_db_connection();
        const requester_id = current_appointment.id_requester;
        const fixer_id = current_appointment.id_fixer;
        const date_selected = current_appointment.selected_date;
        const time_starting = current_appointment.starting_time;

        const db = mongoose.connection.db!;
        const formated_id_fixer = new mongoose.Types.ObjectId(fixer_id);
        const formated_id_requester = new mongoose.Types.ObjectId(requester_id);

        const existingRequester = await db.collection('users').findOne({
            _id: formated_id_requester
        });
        if (!existingRequester || existingRequester.role !== 'requester') {
            return { result: false, message_state: 'Requester no encontrado.' }
        }

        const existingFixer = await db.collection('users').findOne({
            _id: formated_id_fixer
        });
        if (!existingFixer || existingFixer.role !== 'fixer') {
            return { result: false, message_state: 'Fixer no encontrado.' }
        }

        const exists = await Appointment.findOne({
            id_fixer: fixer_id,
            id_requester: requester_id,
            selected_date: date_selected,
            starting_time: time_starting
        });
        console.log(exists);
        let appointment = null;
        let savedAppointmentData = null; 
        let isNewAppointment = false;




        if (!exists || (exists && exists.cancelled_fixer)) {
            appointment = new Appointment(current_appointment);
           // await appointment.save();

            savedAppointmentData = await appointment.save(); // <-- Guardamos la cita
            isNewAppointment = true; //// Indicamos que es una nueva cita

            //return { result: true, message_state: 'Cita creada correctamente.' };
        } else if (exists && exists.schedule_state === 'cancelled') {
            const id_appointmente_exists = exists._id;
            current_appointment.schedule_state = 'booked';
            current_appointment.reprogram_reason = '';

            savedAppointmentData = await Appointment.findByIdAndUpdate( // <-- Guardamos la cita actualizada
                id_appointmente_exists,
                { $set: current_appointment },
                { new: true }
            );
                isNewAppointment = false; // Indicamos que no es una nueva cita
           /// return { result: true, message_state: 'Cita creada correctamente.' };
        } else {
            return { result: true, message_state: 'No se puede crear la cita, la cita ya existe.' };
        }
           
        // --- INICIO DE LA LÓGICA DE NOTIFICACIÓN ---////////
        
        if (savedAppointmentData) {
            try {

                const requesterParaNotificar = {
                    ...existingRequester, // Copiamos datos de la BD (como el email)
                    name: current_appointment.current_requester_name, // Usamos el nombre del formulario
                    phone: current_appointment.current_requester_phone // <-- Usamos el teléfono del formulario
                };
                // ¡Llamada simplificada!
                await notificationService.sendAppointmentConfirmation(
                    existingFixer,
                    requesterParaNotificar,
                    savedAppointmentData,
                    //isNewAppointment//creo que es innecesario este parametro
                );

            } catch (notificationError) {
                // Si la notificación falla, solo lo imprimimos en la consola del backend
                // ¡No detenemos el proceso! La cita ya se guardó.
                console.error("===================================");
                console.error("🚨 ERROR AL ENVIAR NOTIFICACIÓN (la cita SÍ se guardó) 🚨");
                console.error((notificationError as Error).message);
                console.error("===================================");
            }
        }
        // --- FIN DE LA LÓGICA DE NOTIFICACIÓN ---////////

        
        return { result: true, message_state: 'Cita creada correctamente.' };   


    } catch (err) {
        throw new Error('Error creating appointment: ' + (err as Error).message);
    }
}