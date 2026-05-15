import { transport } from "../config/nodemailer";

type EmailType = {
  name: string;
  email: string;
  token: string;
};

export class AuthEmail {
  static sendConfirmation = async (user: EmailType) => {
    const email = await transport.sendMail({
      from: "CashTracker <admin@cashtrackr.com>",
      to: user.email,
      subject: "CashTrackr - Confirma tu cuenta",
      html: `
                <h1>Hola ${user.name}</h1>
                <p>Gracias por registrarte en CashTrackr.</p>
                <p>Para confirmar tu cuenta, haz clic en el siguiente enlace:</p>
                <a href="#">Confirmar cuenta</a>
                <p>e ingresa el código: <b>${user.token}</b></p>
                `,
    });
    console.log('Email enviado', email.messageId);
  };
  static sendPasswordResetToken = async (user: EmailType) => {
    const email = await transport.sendMail({
      from: "CashTracker <admin@cashtrackr.com>",
      to: user.email,
      subject: "CashTrackr - Restablece tu password",
      html: `
                <h1>Hola ${user.name}</h1>
                <p>Para restablecer tu password, haz clic en el siguiente enlace:</p>
                <a href="#">Restablece password</a>
                <p>e ingresa el código: <b>${user.token}</b></p>
                `,
    });
    console.log('Email enviado', email.messageId);
  };
}
