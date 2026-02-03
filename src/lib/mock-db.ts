export const MOCK_DB = {
  users: [
    { id: '1', name: 'Admin Dushow', email: 'admin@dushow.com.br', role: 'ADMIN' },
    { id: '2', name: 'DJ Alok', email: 'alok@music.com', role: 'PRO', points: 1250, isVerified: true },
    { id: '3', name: 'Clube Privilège', email: 'contato@privilege.com', role: 'CLIENT' },
  ],
  stats: {
    totalRevenue: 154200.50,
    activeContracts: 42,
    newArtists: 128,
    platformCommissions: 23130.00
  },
  contracts: [
    { id: 'c1', event: 'Sunset Party', pro: 'DJ Alok', client: 'Clube Privilège', value: 15000, status: 'PAID' },
    { id: 'c2', event: 'Casamento VIP', pro: 'Banda Jazz In', client: 'Maria Silva', value: 4500, status: 'PENDING' },
  ]
};