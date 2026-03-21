import { Peer } from 'peerjs';

export class NetworkManager {
    constructor() {
        this.peer = null;
        this.id = null;
        this.connections = {};
        this.isHost = false;
        
        this.onMapReceived = null;
        this.onPlayerJoined = null;
        this.onPlayerLeft = null;
        this.onPlayerMoved = null;
        this.onActionReceived = null;
    }

    startHost(onReady) {
        this.isHost = true;
        this.peer = new Peer();
        
        this.peer.on('open', (id) => {
            this.id = id;
            if(onReady) onReady(id);
        });

        this.peer.on('connection', (conn) => {
            this.connections[conn.peer] = conn;
            
            conn.on('open', () => {
                if(this.onPlayerJoined) this.onPlayerJoined(conn.peer);
            });

            conn.on('data', (data) => this.handleData(conn.peer, data));
            
            conn.on('close', () => {
                delete this.connections[conn.peer];
                if(this.onPlayerLeft) this.onPlayerLeft(conn.peer);
            });
        });
    }

    joinHost(hostId, onConnected, onError) {
        this.isHost = false;
        this.peer = new Peer();
        
        this.peer.on('open', (id) => {
            this.id = id;
            const conn = this.peer.connect(hostId);
            this.connections[hostId] = conn;
            
            conn.on('open', () => {
                if(onConnected) onConnected();
            });

            conn.on('data', (data) => this.handleData(hostId, data));
            
            conn.on('close', () => {
                console.log("Déconnecté de l'hôte");
                if(this.onPlayerLeft) this.onPlayerLeft(hostId);
            });

            conn.on('error', (err) => {
                console.error("Connection failed:", err);
                if(onError) onError(err);
            })
        });

        this.peer.on('error', (err) => {
            console.error("Peer generation failed:", err);
            if(onError) onError(err);
        });
    }

    handleData(peerId, data) {
        if (!data || !data.type) return;

        switch(data.type) {
            case 'mapSync':
                if(this.onMapReceived) this.onMapReceived(data.payload);
                break;
            case 'playerMoved':
                const sourcePeer = data.sourcePeer || peerId;
                if(this.onPlayerMoved) this.onPlayerMoved(sourcePeer, data.payload);
                if(this.isHost) {
                    this.broadcast({ ...data, sourcePeer: sourcePeer }, [peerId]);
                }
                break;
            case 'action':
                const actionSource = data.sourcePeer || peerId;
                if(this.onActionReceived) this.onActionReceived(actionSource, data.payload);
                if(this.isHost) {
                    this.broadcast({ ...data, sourcePeer: actionSource }, [peerId]);
                }
                break;
        }
    }

    broadcast(data, excludePeers = []) {
        for (const [peerId, conn] of Object.entries(this.connections)) {
            if (!excludePeers.includes(peerId) && conn.open) {
                conn.send(data);
            }
        }
    }
}
