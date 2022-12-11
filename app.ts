import dgram from "dgram";

function hexToDecimal(hex: string): number {
    return parseInt(hex, 16);
}

function magicPacket(macAddress: string): Buffer {
    const parts = macAddress.match(/[0-9a-fA-F]{2}/g);
    if (!parts || parts.length != 6) throw new Error(`"${macAddress}" is an invalid MAC address`);

    const uInt8Arr: number[] = parts.map(p => hexToDecimal(p));
    const macBuf: Buffer = Buffer.from(uInt8Arr);

    let buffer: Buffer = Buffer.alloc(6).fill(0xff);
    for (let i = 0; i < 16; i++) buffer = Buffer.concat([buffer, macBuf]);

    return buffer;
}

async function createSocket(broadcast = false): Promise<dgram.Socket> {
    return new Promise(async (resolve, reject) => {
        const socket: dgram.Socket = dgram.createSocket("udp4");
        socket.on("error", () => {
            socket.close();
            reject("Failed to create socket");
        });
        socket.once("listening", () => {
            socket.setBroadcast(broadcast);
            resolve(socket);
        });
        socket.bind();
    });
}

async function wake(macAddress: string, IPv4: string, port: number): Promise<boolean> {
    const socket: dgram.Socket = await createSocket();
    if (!socket) throw new Error("Can't create socket");

    const packet: Buffer = magicPacket(macAddress);

    return new Promise((resolve, reject) => {
        socket.send(packet, 0, packet.length, port, IPv4, err => {
            if (err) reject(err);
            socket.close();
            resolve(true);
        });
    });
}
