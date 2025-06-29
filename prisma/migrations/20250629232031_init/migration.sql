-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "senhaHash" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concurso" (
    "id" TEXT NOT NULL,
    "nome" TEXT,
    "numero" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "premioEstimado" DOUBLE PRECISION,
    "fechamentoPalpites" TIMESTAMP(3),

    CONSTRAINT "Concurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jogo" (
    "id" TEXT NOT NULL,
    "mandante" TEXT NOT NULL,
    "visitante" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL,
    "resultado" TEXT,
    "placarCasa" INTEGER,
    "placarVisitante" INTEGER,
    "statusJogo" TEXT,
    "tempoJogo" INTEGER,
    "fotoMandante" TEXT,
    "fotoVisitante" TEXT,
    "concursoId" TEXT NOT NULL,

    CONSTRAINT "Jogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Palpite" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "jogoId" TEXT NOT NULL,
    "concursoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "pixId" TEXT,
    "bilheteId" TEXT,

    CONSTRAINT "Palpite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PixPagamento" (
    "id" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "pixCopiaECola" TEXT NOT NULL,
    "pixLocationUrl" TEXT,
    "imagemQrcode" TEXT,
    "locationId" TEXT,
    "ambiente" TEXT,
    "expiracao" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixPagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bilhete" (
    "id" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "quantidadePalpites" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "txid" TEXT,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "concursoId" TEXT NOT NULL,

    CONSTRAINT "Bilhete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL,
    "evento" TEXT NOT NULL DEFAULT 'unknown',
    "txid" TEXT,
    "dados" JSONB NOT NULL DEFAULT '{}',
    "processado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_whatsapp_key" ON "User"("whatsapp");

-- CreateIndex
CREATE UNIQUE INDEX "Palpite_userId_jogoId_key" ON "Palpite"("userId", "jogoId");

-- CreateIndex
CREATE UNIQUE INDEX "PixPagamento_txid_key" ON "PixPagamento"("txid");

-- AddForeignKey
ALTER TABLE "Jogo" ADD CONSTRAINT "Jogo_concursoId_fkey" FOREIGN KEY ("concursoId") REFERENCES "Concurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Palpite" ADD CONSTRAINT "Palpite_concursoId_fkey" FOREIGN KEY ("concursoId") REFERENCES "Concurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Palpite" ADD CONSTRAINT "Palpite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Palpite" ADD CONSTRAINT "Palpite_jogoId_fkey" FOREIGN KEY ("jogoId") REFERENCES "Jogo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Palpite" ADD CONSTRAINT "Palpite_pixId_fkey" FOREIGN KEY ("pixId") REFERENCES "PixPagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Palpite" ADD CONSTRAINT "Palpite_bilheteId_fkey" FOREIGN KEY ("bilheteId") REFERENCES "Bilhete"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bilhete" ADD CONSTRAINT "Bilhete_concursoId_fkey" FOREIGN KEY ("concursoId") REFERENCES "Concurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bilhete" ADD CONSTRAINT "Bilhete_txid_fkey" FOREIGN KEY ("txid") REFERENCES "PixPagamento"("txid") ON DELETE SET NULL ON UPDATE CASCADE;
