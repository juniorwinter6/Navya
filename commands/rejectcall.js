module.exports = {
    name: "rejectcall",

    execute: async (sock) => {

        // listen for calls
        sock.ev.on("call", async (callData) => {

            for (const call of callData) {

                if (call.status === "offer") {

                    console.log("📞 Call detected, rejecting...")

                    await sock.rejectCall(call.id, call.from)

                }
            }
        })

        console.log("📵 Call rejection system loaded")
    }
}