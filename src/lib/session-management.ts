import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface SessionInfo {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  deviceType: string
  location?: string
  lastActiveAt: Date
  createdAt: Date
  expiresAt: Date
  isActive: boolean
}

export interface SessionConfig {
  maxIdleTime: number // seconds
  maxSessionTime: number // seconds
  maxConcurrentSessions: number
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxIdleTime: 3600, // 1 hour
  maxSessionTime: 30 * 24 * 3600, // 30 days
  maxConcurrentSessions: 5,
}

/**
 * Session management utility for enhanced security
 */
export class SessionManager {
  private supabase: SupabaseClient
  private config: SessionConfig

  constructor(supabase: SupabaseClient, config: SessionConfig = DEFAULT_SESSION_CONFIG) {
    this.supabase = supabase
    this.config = config
  }

  /**
   * Creates a new session record
   */
  async createSession(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    deviceType?: string,
    location?: string
  ): Promise<void> {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.config.maxSessionTime * 1000)

    try {
      // First, cleanup old sessions for this user
      await this.cleanupExpiredSessions(userId)
      
      // Check concurrent session limit
      const activeSessions = await this.getActiveSessions(userId)
      if (activeSessions.length >= this.config.maxConcurrentSessions) {
        // Revoke the oldest session
        const oldestSession = activeSessions.sort((a, b) => 
          new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()
        )[0]
        await this.revokeSession(oldestSession.id)
      }

      // Create new session
      const { error } = await this.supabase
        .from("user_sessions")
        .insert({
          user_id: userId,
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent: userAgent,
          device_type: deviceType || this.detectDeviceType(userAgent),
          location,
          expires_at: expiresAt.toISOString(),
          max_idle_time: this.config.maxIdleTime,
          last_active_at: now.toISOString(),
        })

      if (error) {
        console.error("Failed to create session:", error)
      }
    } catch (error) {
      console.error("Session creation error:", error)
    }
  }

  /**
   * Updates session activity timestamp
   */
  async updateSessionActivity(sessionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("user_sessions")
        .update({
          last_active_at: new Date().toISOString()
        })
        .eq("session_id", sessionId)
        .is("revoked_at", null)

      return !error
    } catch {
      return false
    }
  }

  /**
   * Validates if a session is still active and not expired
   */
  async validateSession(sessionId: string): Promise<SessionInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from("user_sessions")
        .select("*")
        .eq("session_id", sessionId)
        .is("revoked_at", null)
        .single()

      if (error || !data) return null

      const now = new Date()
      const lastActive = new Date(data.last_active_at)
      const expires = new Date(data.expires_at)
      const maxIdleMs = (data.max_idle_time || this.config.maxIdleTime) * 1000

      // Check if session is expired or idle too long
      if (expires < now || (now.getTime() - lastActive.getTime()) > maxIdleMs) {
        await this.revokeSession(data.id)
        return null
      }

      // Update activity
      await this.updateSessionActivity(sessionId)

      return {
        id: data.id,
        userId: data.user_id,
        ipAddress: data.ip_address,
        userAgent: data.user_agent,
        deviceType: data.device_type,
        location: data.location,
        lastActiveAt: lastActive,
        createdAt: new Date(data.created_at),
        expiresAt: expires,
        isActive: true,
      }
    } catch {
      return null
    }
  }

  /**
   * Revokes a specific session
   */
  async revokeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("user_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", sessionId)

      return !error
    } catch {
      return false
    }
  }

  /**
   * Revokes all sessions for a user (e.g., on password change)
   */
  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<boolean> {
    try {
      let query = this.supabase
        .from("user_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("user_id", userId)
        .is("revoked_at", null)

      if (exceptSessionId) {
        query = query.neq("session_id", exceptSessionId)
      }

      const { error } = await query

      return !error
    } catch {
      return false
    }
  }

  /**
   * Gets all active sessions for a user
   */
  async getActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data, error } = await this.supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("revoked_at", null)
        .order("last_active_at", { ascending: false })

      if (error || !data) return []

      const now = new Date()
      const activeSessions: SessionInfo[] = []

      for (const session of data) {
        const lastActive = new Date(session.last_active_at)
        const expires = new Date(session.expires_at)
        const maxIdleMs = (session.max_idle_time || this.config.maxIdleTime) * 1000

        // Skip expired or idle sessions
        if (expires < now || (now.getTime() - lastActive.getTime()) > maxIdleMs) {
          continue
        }

        activeSessions.push({
          id: session.id,
          userId: session.user_id,
          ipAddress: session.ip_address,
          userAgent: session.user_agent,
          deviceType: session.device_type,
          location: session.location,
          lastActiveAt: lastActive,
          createdAt: new Date(session.created_at),
          expiresAt: expires,
          isActive: true,
        })
      }

      return activeSessions
    } catch {
      return []
    }
  }

  /**
   * Cleanup expired sessions for a user
   */
  async cleanupExpiredSessions(userId?: string): Promise<void> {
    try {
      let query = this.supabase
        .from("user_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .is("revoked_at", null)

      if (userId) {
        query = query.eq("user_id", userId)
      }

      // Mark as revoked if expired or idle too long
      const now = new Date()
      await query.or(`expires_at.lt.${now.toISOString()},last_active_at.lt.${new Date(now.getTime() - this.config.maxIdleTime * 1000).toISOString()}`)
    } catch (error) {
      console.error("Session cleanup error:", error)
    }
  }

  /**
   * Detects device type from user agent
   */
  private detectDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile'
    }
    
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet'
    }
    
    return 'desktop'
  }
}

/**
 * Global session manager instance
 */
let globalSessionManager: SessionManager | null = null

export function getSessionManager(supabase?: SupabaseClient): SessionManager {
  if (!globalSessionManager && supabase) {
    globalSessionManager = new SessionManager(supabase)
  }
  
  if (!globalSessionManager) {
    throw new Error("Session manager not initialized. Call with supabase client first.")
  }
  
  return globalSessionManager
}

/**
 * Middleware helper for session validation
 */
export async function validateSessionMiddleware(
  sessionId: string,
  supabase: SupabaseClient
): Promise<SessionInfo | null> {
  const manager = new SessionManager(supabase)
  return await manager.validateSession(sessionId)
}