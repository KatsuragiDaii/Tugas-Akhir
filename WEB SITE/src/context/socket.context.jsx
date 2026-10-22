import { createContext, createSignal, createEffect, createMemo, onCleanup, useContext } from "solid-js";

import { io } from "socket.io-client";
import { UseAuthCtx } from "./auth.context";
import { SOCKET_TAG } from "../json/socket-tag-json";
import { UseDataCtx } from "./data.context";

export const SocketCtx = createContext();

export function SocketCtxProv(props) {

    const [nodeSocket, setNodeSocket] = createSignal();
    const { data, setData } = UseDataCtx();
    const { auth } = UseAuthCtx();
    const [millis, setMillis] = createSignal(1.5);
    const [image, setImage] = createSignal();

    const UpdateMillis = () => {
        var state = new Date().getMilliseconds() - millis() < 1500 ? "Online" : "Offline"
        setMillis(new Date().getMilliseconds())
        return state;
    }

    // PENYEBAB LOG "Socket connection was made ..." BERULANG:
    // loadUser() (dipanggil di setiap layout) selalu membuat objek auth BARU, sehingga effect
    // yang bergantung pada auth() jalan lagi dan membuka koneksi io() baru tanpa menutup yang lama.
    // createMemo di bawah hanya berubah bila string token-nya berubah (login / logout).
    const token = createMemo(() => auth() && auth().token);

    createEffect(
        () => {
            const socket = nodeSocket();
            const user = auth();
            if (socket && user && user.token) {
                socket.emit(SOCKET_TAG.refresh, { userId: user.id, name: user.username, role: user.role })
            }
        }
    )

    createEffect(
        () => {
            if (!token()) return;

            const conn = io(`${import.meta.env.VITE_SOCKET_SERVER_HOST}`)

            // Listener dipasang SEKALI di sini. Dulu dipasang di dalam "connect", sehingga
            // setiap reconnect menambah listener baru dan setiap data diproses berkali-kali.
            const tags = [
                SOCKET_TAG.pltsPV,
                SOCKET_TAG.pltsOffGrid,
                SOCKET_TAG.pltsOnGrid,
                SOCKET_TAG.pltb,
                SOCKET_TAG.pltmh,
            ]
            tags.forEach((tag) => {
                conn.on(tag, (value) => {
                    value.payload.state = UpdateMillis();
                    setData({ ...data(), [tag]: value.payload })
                })
            })

            conn.on("webcam", (value) => {
                setImage(value);
            })

            conn.on("connect", () => {
                console.log(`connected to socket server`)
            })

            conn.on("disconnect", (reason) => {
                console.log(`disconnecting from socket server ${import.meta.env.VITE_SOCKET_SERVER_HOST} (${reason})`)
            })

            conn.on("connect_error", (error) => {
                console.warn(`socket connect_error: ${error.message}`)
            })

            setNodeSocket(conn)

            // Dijalankan saat logout, saat token berubah, atau saat komponen dilepas:
            // koneksi lama ditutup sehingga tidak pernah ada lebih dari satu socket per tab.
            onCleanup(() => {
                conn.off();
                conn.disconnect();
                setNodeSocket(undefined);
            })
        }
    )

    return (
        <SocketCtx.Provider value={{ nodeSocket, setNodeSocket, millis, image }}>
            {props.children}
        </SocketCtx.Provider>
    )

}

export function UseSocketCtx() {
    return useContext(SocketCtx);
}
