// src/lib/logger.ts

type LogLevel = 'log' | 'warn' | 'error' | 'info'

interface LoggerOptions {
    prefix?: string
    timestamp?: boolean
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development'

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString()
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`
        return data ? `${prefix} ${message}` : `${prefix} ${message}`
    }

    log(message: string, data?: any) {
        if (this.isDevelopment) {
            console.log(this.formatMessage('log', message, data), data || '')
        }
    }

    info(message: string, data?: any) {
        if (this.isDevelopment) {
            console.info(this.formatMessage('info', message, data), data || '')
        }
    }

    warn(message: string, data?: any) {
        if (this.isDevelopment) {
            console.warn(this.formatMessage('warn', message, data), data || '')
        }
    }

    error(message: string, error?: any) {
        // Always log errors, even in production
        console.error(this.formatMessage('error', message, error), error || '')
    }

    debug(message: string, data?: any) {
        if (this.isDevelopment) {
            console.debug(this.formatMessage('log', message, data), data || '')
        }
    }
}

export const logger = new Logger()

// Shorthand exports for common use
export const logError = (message: string, error?: any) => logger.error(message, error)
export const logWarn = (message: string, data?: any) => logger.warn(message, data)
export const logInfo = (message: string, data?: any) => logger.info(message, data)
export const logDebug = (message: string, data?: any) => logger.debug(message, data)
