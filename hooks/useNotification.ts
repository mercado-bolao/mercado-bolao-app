
import { useState, useCallback } from 'react'
import type { Notification } from '@/types'

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
  }
}
