import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@opuscentersrl.it' },
    update: {},
    create: {
      email: 'admin@opuscentersrl.it',
      password: adminPassword,
      name: 'Admin Opus Center',
      role: 'ADMIN'
    }
  })

  // Spaces
  const office = await prisma.space.upsert({
    where: { id: 'seed-space-office-1' },
    update: {},
    create: {
      id: 'seed-space-office-1',
      name: 'Office 1',
      type: 'OFFICE',
      capacity: 1,
      hourlyRate: 15.0,
      dailyRate: 100.0,
      monthlyRate: 500.0,
      description: 'Fully furnished private office',
      amenities: ['Wi-Fi', 'Air Conditioning', '24/7 Access']
    }
  })

  const meetingRoom = await prisma.space.upsert({
    where: { id: 'seed-space-meeting-a' },
    update: {},
    create: {
      id: 'seed-space-meeting-a',
      name: 'Meeting Room A',
      type: 'MEETING_ROOM',
      capacity: 8,
      hourlyRate: 25.0,
      dailyRate: 180.0,
      monthlyRate: 800.0,
      description: 'Conference room with projector and whiteboard',
      amenities: ['Projector', 'Whiteboard', 'Wi-Fi', 'Air Conditioning']
    }
  })

  const coworkingDesk = await prisma.space.upsert({
    where: { id: 'seed-space-coworking-1' },
    update: {},
    create: {
      id: 'seed-space-coworking-1',
      name: 'Coworking Desk 1',
      type: 'COWORKING',
      capacity: 1,
      hourlyRate: 8.0,
      dailyRate: 50.0,
      monthlyRate: 200.0,
      description: 'Desk in open workspace',
      amenities: ['Wi-Fi', 'Printer Access', 'Break Area']
    }
  })

  // Client
  const client = await prisma.client.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      phone: '+1 555 123 4567',
      company: 'Doe Consulting LLC',
      vatNumber: 'US123456789',
      address: '123 Main Street, New York, NY'
    }
  })

  console.log('Database seeded successfully')
  console.log('Admin user:', admin.email, '/ password: admin123')
  console.log('Spaces created:', [office.name, meetingRoom.name, coworkingDesk.name].join(', '))
  console.log('Client created:', client.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })