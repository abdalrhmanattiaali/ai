/**
 * WhatsApp API Module - QR Code & Status Management
 * Integrates with Admin Dashboard
 */

const axios = require('axios');
const QRCode = require('qrcode');

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5010';

class WhatsAppAPI {
    constructor(client) {
        this.client = client;
        this.currentQRCode = null;
    }

    /**
     * Setup WhatsApp event handlers for dashboard integration
     */
    setupEventHandlers() {
        // QR Code event
        this.client.on('qr', async (qr) => {
            console.log('📱 QR Code generated');

            try {
                // Generate QR code as data URL
                const qrDataURL = await QRCode.toDataURL(qr);
                this.currentQRCode = qrDataURL;

                // Send to Admin API
                await axios.post(`${ADMIN_API_URL}/api/whatsapp/qr-code`, {
                    qr_code: qrDataURL
                });

                console.log('✅ QR Code sent to Admin Dashboard');
            } catch (error) {
                console.error('Error sending QR code to dashboard:', error.message);
            }
        });

        // Ready event
        this.client.on('ready', async () => {
            console.log('✅ WhatsApp connected');

            try {
                // Get phone number
                const info = await this.client.info;
                const phoneNumber = info.wid.user;

                // Update status in Admin API
                await axios.post(`${ADMIN_API_URL}/api/whatsapp/status`, {
                    is_connected: true,
                    phone_number: phoneNumber
                });

                console.log(`✅ WhatsApp status updated - Phone: ${phoneNumber}`);
            } catch (error) {
                console.error('Error updating WhatsApp status:', error.message);
            }
        });

        // Disconnected event
        this.client.on('disconnected', async (reason) => {
            console.log('❌ WhatsApp disconnected:', reason);

            try {
                await axios.post(`${ADMIN_API_URL}/api/whatsapp/status`, {
                    is_connected: false
                });

                console.log('✅ Disconnection status sent to Admin Dashboard');
            } catch (error) {
                console.error('Error updating disconnect status:', error.message);
            }
        });

        // Authentication failure
        this.client.on('auth_failure', async (msg) => {
            console.error('❌ Authentication failed:', msg);

            try {
                await axios.post(`${ADMIN_API_URL}/api/whatsapp/status`, {
                    is_connected: false,
                    error: 'Authentication failed'
                });
            } catch (error) {
                console.error('Error sending auth failure status:', error.message);
            }
        });
    }

    /**
     * API Endpoints
     */
    registerRoutes(app) {
        // Generate new QR code
        app.post('/api/whatsapp/generate-qr', async (req, res) => {
            try {
                if (this.client.info) {
                    return res.status(400).json({
                        error: 'WhatsApp already connected',
                        phone_number: this.client.info.wid.user
                    });
                }

                // Logout to generate new QR
                await this.client.logout();

                // Reinitialize client
                await this.client.initialize();

                res.json({ message: 'QR code generation requested' });
            } catch (error) {
                console.error('Error generating QR:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get current QR code
        app.get('/api/whatsapp/current-qr', (req, res) => {
            if (this.currentQRCode) {
                res.json({ qr_code: this.currentQRCode });
            } else {
                res.status(404).json({ error: 'No QR code available' });
            }
        });

        // Get connection status
        app.get('/api/whatsapp/connection-status', async (req, res) => {
            try {
                const isConnected = this.client.info ? true : false;
                const phoneNumber = isConnected ? this.client.info.wid.user : null;

                res.json({
                    is_connected: isConnected,
                    phone_number: phoneNumber,
                    has_qr: this.currentQRCode !== null
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Disconnect WhatsApp
        app.post('/api/whatsapp/disconnect', async (req, res) => {
            try {
                await this.client.logout();
                this.currentQRCode = null;

                res.json({ message: 'WhatsApp disconnected successfully' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Test send message
        app.post('/api/whatsapp/test-message', async (req, res) => {
            try {
                const { to, message } = req.body;

                if (!to || !message) {
                    return res.status(400).json({ error: 'to and message required' });
                }

                if (!this.client.info) {
                    return res.status(400).json({ error: 'WhatsApp not connected' });
                }

                await this.client.sendMessage(to, message);

                res.json({ message: 'Message sent successfully' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
}

module.exports = WhatsAppAPI;
