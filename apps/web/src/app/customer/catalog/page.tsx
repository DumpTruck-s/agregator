'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Org { id: string; name: string; description: string; logo?: string }

export default function CatalogPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    api.get<Org[]>('/api/orgs').then(setOrgs).catch(console.error);
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Restaurants</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgs.map(org => (
          <Link key={org.id} href={`/customer/org/${org.id}`} className="border rounded-lg p-4 hover:shadow-md transition">
            <div className="text-4xl mb-2">{org.logo || '🍽️'}</div>
            <h2 className="font-semibold">{org.name}</h2>
            <p className="text-sm text-gray-500">{org.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
