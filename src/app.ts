import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.config';

import jobOfertRoutes from './api/routes/jobOfert.routes';
import newoffersRoutes from './api/routes/newOffers.routes';
import fixerRoutes from './api/routes/fixer.routes';
import jobsRoutes from './api/routes/jobs.routes';
import registrarDatosRouter from './api/routes/userManagement/registrarDatos.routes';
import fotoPerfilRouter from './api/routes/userManagement/fotoPerfil.routes';
import googleRouter from './api/routes/userManagement/google.routes';
import ubicacionRouter from './api/routes/userManagement/ubicacion.routes';
import authRouter from './api/routes/userManagement/login.routes';
import modificarDatosRouter from './api/routes/userManagement/modificarDatos.routes';
import nominatimRouter from './api/routes/userManagement/sugerencias.routes';
import deviceRouter from './api/routes/userManagement/device.routes';
import cambiarContrasenaRouter from './api/routes/userManagement/editarContraseña.routes';
import cerrarSesionesRouter from './api/routes/userManagement/cerrarSesiones.routes';
import ultimoCambioRouter from './api/routes/userManagement/ultimoCambio.routes';
import githubAuthRouter from './api/routes/userManagement/github.routes';
import discordRoutes from './api/routes/userManagement/discord.routes';
import clienteRouter from './api/routes/userManagement/cliente.routes';
import obtenerContrasenaRouter from './api/routes/userManagement/obtener.routes';

import CreateRoutes from './api/routes/create_appointment.routes';
import ReadRoutes from './api/routes/read_appointment.routes';
import UpdateRoutes from './api/routes/update_appointment.routes';
import LocationRoutes from './api/routes/location.routes';
import GetScheduleRoutes from './api/routes/get_schedule.routes';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/devmaster', jobOfertRoutes);
app.use('/api/newOffers', newoffersRoutes);
app.use('/api/fixers', fixerRoutes);
// app.use('/api/user-profiles', userProfileRoutes);
app.use('/api/jobs', jobsRoutes);

app.use('/api/controlC/google', googleRouter);
app.use('/api/controlC/ubicacion', ubicacionRouter);
app.use('/api/controlC/auth', authRouter);
app.use('/api/controlC/registro', registrarDatosRouter);
app.use('/api/controlC/modificar-datos', modificarDatosRouter);
app.use('/api/controlC/sugerencias', nominatimRouter);
app.use('/api/controlC/cambiar-contrasena', cambiarContrasenaRouter);
app.use('/api/controlC/cerrar-sesiones', cerrarSesionesRouter);
app.use('/api/controlC/ultimo-cambio', ultimoCambioRouter);
app.use('/api/controlC/foto-perfil', fotoPerfilRouter);
app.use('/api/controlC/obtener-password', obtenerContrasenaRouter);
app.use('/auth', githubAuthRouter);
app.use('/auth', discordRoutes);
app.use('/api/controlC/cliente', clienteRouter);

app.use('/api/location', LocationRoutes);
app.use('/api/crud_create', CreateRoutes);
app.use('/api/crud_read', ReadRoutes);
app.use('/api/crud_update', UpdateRoutes);
app.use('/api/crud_read', GetScheduleRoutes);

export const registerRoutes = (app: express.Application) => {
  app.use('/devices', deviceRouter);
};

app.use((req, res) => {
  console.log('Not found:', req.method, req.originalUrl);
  res.status(404).send({
    message: 'route not found',
  });
});

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(8000, () => console.log('Servidor corriendo en puerto 8000'));
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer();

export default app;
