import { NextRequest, NextResponse } from 'next/server';
import { authenticator } from 'otplib';

export async function POST(request: NextRequest) {
  try {
    const { secret, code } = await request.json();

    if (!secret || !code) {
      return NextResponse.json(
        { error: 'Secret e código são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o código TOTP é válido
    const isValid = authenticator.verify({
      token: code,
      secret: secret,
    });

    if (isValid) {
      return NextResponse.json({ valid: true });
    } else {
      return NextResponse.json(
        { error: 'Código inválido' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Erro na verificação TOTP:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
