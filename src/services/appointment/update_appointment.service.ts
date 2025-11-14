import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import db_connection from '../../database.js';
import Appointment from '../../models/Appointment.js';

dotenv.config();

let connected = false;

async function set_db_connection() {
    if (!connected) {
        await db_connection();
        connected = true;
    }
}

// * Fixed Endpoint Pichon: Refactorizar y probar en Postman.
// * El endpoint estaba actualizando mas slots de los que deberia, ahora con el nuevo esquema actualiza lo solicitado.
export async function update_appointment_by_id(id: string, attributes: Record<string, unknown>) {
    try {
        await set_db_connection();

        // * atributos hay que tener cuidado con schedule (ya no es necesario con el nuevo esquema).
        // * desestructurar schedule (ya no es necesario con el nuevo esquema).

        const updated_appointment = await Appointment.findByIdAndUpdate(
            id,
            { $set: attributes },
            { new: true },
        );

        if (updated_appointment) {
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