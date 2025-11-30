import { User } from "../../models/user.model";
import { IUser } from "../../models/user.model";
import bcrypt from "bcryptjs";

interface ManualUser {
  email: string;
  name: string;
  picture?: string;
  password: string;
}

interface InsertedUser {
  email: string;
  name: string;
}

export async function checkUserExists(email: string): Promise<boolean> {
  const user = await User.findOne({
    "authProviders.provider": "email",
    "authProviders.providerId": email,
  });

  return !!user;
}

export async function createManualUser(
  user: ManualUser
): Promise<InsertedUser & { _id: string; picture?: string }> {
  
  const hashedPassword = await bcrypt.hash(user.password, 10);

  const newUserData: Partial<IUser> = {
    name: user.name,
    email: user.email,
    url_photo: user.picture || "",
    role: "requester",

    authProviders: [
      {
        provider: "email",
        providerId: user.email,
        password: hashedPassword,
      },
    ],

    telefono: "",
    servicios: [],

    ubicacion: {
      lat: 0,
      lng: 0,
      direccion: "",
      departamento: "",
      pais: "",
    },

    ci: "",

    vehiculo: {
      hasVehiculo: false,
      tipoVehiculo: "",
    },

    acceptTerms: false,

    metodoPago: {
      hasEfectivo: false,
      qr: false,
      tarjetaCredito: false,
    },

    experience: {
      descripcion: "",
    },

    workLocation: {
      lat: 0,
      lng: 0,
      direccion: "",
      departamento: "",
      pais: "",
    },

    fixerProfile: "",
  };

  const created = await User.create(newUserData);

  console.log("Usuario manual creado:", user.email);

  return {
    _id: created._id.toString(),
    name: created.name,
    email: created.email,
    picture: created.url_photo,
  };
}

export async function getUserById(usuarioId: string): Promise<IUser | null> {
  const user = await User.findById(usuarioId);
  return user;
}
