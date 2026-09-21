"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import prisma from "@repo/db/client";
import { error } from "console";
import { resolve } from "path";

export async function P2pTransfer(to: string, amount: number) {
    // check the user is valid user
    const session = await getServerSession(authOptions)
    const from = session?.user?.id;
    if (!from) {
        return {
            message: "error while sending",
        }
    }

    const toUser = await prisma.user.findFirst({
        where: {
            number: to
        }
    });
    if (!toUser) {
        return {
            message: "user not found"
        }
    }

    await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT * FROM "BALANCE" WHERE "userId" = ${Number(from)} FOR UPDATE`
        const fromBalance = await tx.balance.findUnique({
            where: { userId: Number(from) },
        });
        console.log("above sleep")
        await new Promise(resolve => setTimeout(resolve, 4000));
        if (!fromBalance || fromBalance.amount < amount) {
            throw new Error("insufficent funds");
        }
        console.log("after sleep");

        await tx.balance.update({
            where: { userId: Number(from) },
            data: { amount: { decrement: amount } }
        })

        await tx.balance.update({
            where: { userId: toUser.id },
            data: { amount: { increment: amount } }
        })
    });


}