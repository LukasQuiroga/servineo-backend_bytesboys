import Stripe from 'stripe';
import { Card } from '../../models/card.model';
import { User } from '../../models/userPayment.model';
import 'dotenv/config';
import { Request, Response } from 'express';

// Validar que la clave de Stripe existe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('❌ STRIPE_SECRET_KEY no está definida en las variables de entorno');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCard = async (req: Request, res: Response) => {
  try {
    const { userId, paymentMethodId, saveCard, cardholderName } = req.body;

    // 1. Buscar usuario en MongoDB
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
      });

      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    } else {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (error: unknown) {
        console.log((error as Error).message);
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      }
    }

    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    if (saveCard) {
      if (!paymentMethod.card) {
        return res.status(400).json({
          error: 'El método de pago proporcionado no es una tarjeta válida.',
        });
      }

      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethod.id },
      });

      const newCard = await Card.create({
        userId,
        stripePaymentMethodId: paymentMethod.id,
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
        isDefault: true,
        cardholderName,
      });

      return res.json(newCard);
    }

    // 5. Retornar mensaje si no se guardó
    res.json({ message: 'Tarjeta agregada para pago, no guardada' });
  } catch (error) {
    console.error('Error createCard:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const listCards = async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId es requerido' });
    }

    const cards = await Card.find({ userId });
    res.json(cards);
  } catch (error) {
    console.error('Error listCards:', error);
    res.status(500).json({ error: (error as Error).message });
  }
};
