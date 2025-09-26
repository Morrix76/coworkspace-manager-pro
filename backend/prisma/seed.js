import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin user
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

  // Create sample spaces
  const spaces = await Promise.all([
    prisma.space.create({
      data: {
        name: 'Office 1',
        type: 'OFFICE',
        capacity: 1,
        hourlyRate: 15.0,
        dailyRate: 100.0,
        monthlyRate: 500.0,
        description: 'Fully furnished private office',
        amenities: 'Wi-Fi, Air Conditioning, 24/7 Access'
      }
    }),
    prisma.space.create({
      data: {
        name: 'Meeting Room A',
        type: 'MEETING_ROOM',
        capacity: 8,
        hourlyRate: 25.0,
        dailyRate: 180.0,
        monthlyRate: 800.0,
        description: 'Conference room with projector and whiteboard',
        amenities: 'Projector, Whiteboard, Wi-Fi, Air Conditioning'
      }
    }),
    prisma.space.create({
      data: {
        name: 'Coworking Desk 1',
        type: 'COWORKING',
        capacity: 1,
        hourlyRate: 8.0,
        dailyRate: 50.0,
        monthlyRate: 200.0,
        description: 'Desk in open workspace',
        amenities: 'Wi-Fi, Printer Access, Break Area'
      }
    })
  ])

  // Create sample client
  const client = await prisma.client.create({
    data: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      phone: '+1 555 123 4567',
      company: 'Doe Consulting LLC',
      vatNumber: 'US123456789',
      address: '123 Main Street, New York, NY'
    }
  })

  console.log('Database seeded successfully')
  console.log('Admin user:', admin.email, 'password: admin123')
  console.log('Spaces created:', spaces.length)
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