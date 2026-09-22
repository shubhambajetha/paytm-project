"use client"
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Center } from "@repo/ui/center";
import { TextInput } from "@repo/ui/textinput";
import { useState } from "react";
import { p2pTransfer } from "../app/lib/action/p2pTransfer";

export const PersonPayer = () => {
    const [number, setNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);


    return (
        <div className="h-[90]">
            <Center>
                <Card title="Send">
                    <div className="min-w-72 pt-2">
                        <TextInput 
                            value={number}
                            placeholder={"Number"} 
                            label="Number" 
                            onChange={(value) => {
                                setNumber(value);
                            }} 
                        />
                        <TextInput 
                            value={amount}
                            placeholder={"Amount"} 
                            label="Amount" 
                            onChange={(value) => {
                                setAmount(value);
                            }} 
                        />
                        <div className="pt-4 flex justify-center">
                            <Button onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await p2pTransfer(number, Number(amount));
                                    if (res?.message) {
                                        alert(res.message);
                                    }
                                    if (res?.success) {
                                        setNumber("");
                                        setAmount("");
                                    }
                                } catch (e: any) {
                                    alert(e?.message || "Something went wrong");
                                } finally {
                                    setLoading(false);
                                }
                            }}>
                                {loading ? "Sending..." : "Send"}
                            </Button>
                        </div>
                    </div>
                </Card>
            </Center>
        </div>
    );
};