/**
 * Server-Sent Events (SSE) Service
 * Manages real-time notifications to clients
 */

class SSEService {
    constructor() {
        // Store active connections by user ID
        this.clients = new Map();
        // Store admin connections separately
        this.adminClients = new Set();
    }

    /**
     * Add a client connection
     * @param {string} userId - User ID
     * @param {object} res - Express response object
     * @param {boolean} isAdmin - Whether this is an admin connection
     */
    addClient(userId, res, isAdmin = false) {
        // Set headers for SSE
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // Disable buffering in nginx
        });

        // Send initial connection message
        res.write('data: {"type":"connected","message":"SSE connection established"}\n\n');

        if (isAdmin) {
            this.adminClients.add(res);
        } else {
            if (!this.clients.has(userId)) {
                this.clients.set(userId, new Set());
            }
            this.clients.get(userId).add(res);
        }

        // Handle client disconnect
        res.on('close', () => {
            if (isAdmin) {
                this.adminClients.delete(res);
            } else {
                const userClients = this.clients.get(userId);
                if (userClients) {
                    userClients.delete(res);
                    if (userClients.size === 0) {
                        this.clients.delete(userId);
                    }
                }
            }
        });
    }

    /**
     * Send event to specific user
     * @param {string} userId - User ID
     * @param {string} event - Event type
     * @param {object} data - Event data
     */
    sendToUser(userId, event, data) {
        const userClients = this.clients.get(userId);
        if (userClients) {
            const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
            userClients.forEach(client => {
                try {
                    client.write(message);
                } catch (error) {
                    console.error('Error sending SSE to user:', error);
                }
            });
        }
    }

    /**
     * Send event to all admin clients
     * @param {string} event - Event type
     * @param {object} data - Event data
     */
    sendToAdmins(event, data) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        this.adminClients.forEach(client => {
            try {
                client.write(message);
            } catch (error) {
                console.error('Error sending SSE to admin:', error);
            }
        });
    }

    /**
     * Broadcast to all connected clients
     * @param {string} event - Event type
     * @param {object} data - Event data
     */
    broadcast(event, data) {
        const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

        // Send to all users
        this.clients.forEach(userClients => {
            userClients.forEach(client => {
                try {
                    client.write(message);
                } catch (error) {
                    console.error('Error broadcasting SSE:', error);
                }
            });
        });

        // Send to all admins
        this.adminClients.forEach(client => {
            try {
                client.write(message);
            } catch (error) {
                console.error('Error broadcasting SSE to admin:', error);
            }
        });
    }

    /**
     * Get connection statistics
     */
    getStats() {
        let totalUserConnections = 0;
        this.clients.forEach(userClients => {
            totalUserConnections += userClients.size;
        });

        return {
            uniqueUsers: this.clients.size,
            totalUserConnections,
            adminConnections: this.adminClients.size
        };
    }
}

// Export singleton instance
module.exports = new SSEService();
