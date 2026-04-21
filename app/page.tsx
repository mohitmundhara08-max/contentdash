'use client'
import { useEffect } from 'react'

export default function Root() {
  useEffect(() => {
    window.location.replace('/dashboard')
  }, [])
  return null
}
