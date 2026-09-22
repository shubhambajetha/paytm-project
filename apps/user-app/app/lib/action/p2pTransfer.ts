"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import prisma from "@repo/db/client";

export async function p2pTransfer(to: string, amount: number) {
    const session = await getServerSession(authOptions);
    const from = session?.user?.id;
    if (!from) {
        return {
            message: "Unauthorized: Error while sending"
        };
    }

    if (!amount || isNaN(amount) || amount <= 0) {
        return {
            message: "Please enter a valid amount"
        };
    }

    const toUser = await prisma.user.findFirst({
        where: {
            number: to
        }
    });

    if (!toUser) {
        return {
            message: "User not found"
        };
    }

    if (toUser.id === Number(from)) {
        return {
            message: "Cannot transfer money to yourself"
        };
    }

    const transferAmountInPaise = Math.round(amount * 100);

    try {
        await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId" = ${Number(from)} FOR UPDATE`;

            const fromBalance = await tx.balance.findUnique({
                where: { userId: Number(from) },
            });

            if (!fromBalance || fromBalance.amount < transferAmountInPaise) {
                throw new Error("Insufficient funds");
            }

            await tx.balance.update({
                where: { userId: Number(from) },
                data: { amount: { decrement: transferAmountInPaise } },
            });

            await tx.balance.upsert({
                where: { userId: toUser.id },
                update: { amount: { increment: transferAmountInPaise } },
                create: { userId: toUser.id, amount: transferAmountInPaise, locked: 0 }
            });

            await tx.p2pTransfer.create({
                data: {
                    fromUserId: Number(from),
                    toUserId: toUser.id,
                    amount: transferAmountInPaise,
                    timestamp: new Date()
                }
            });
        });

        return {
            message: "Transfer successful",
            success: true
        };
    } catch (e: any) {
        return {
            message: e?.message || "Transfer failed",
            success: false
        };
    }
}