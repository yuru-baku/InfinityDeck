import type { User } from './user.ts'

export enum Game {
  MauMau,
  Uno
}

export type Room = {
  id: string
  users: User[]
  you: User
  isLocal: boolean
  currentGame: Game
}
