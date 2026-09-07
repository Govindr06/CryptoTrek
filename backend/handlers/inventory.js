/**
 * Amazon ElastiCache (Redis) & Amazon RDS Inventory Handler
 * High-speed caching layer for hotel availability and cab pricing.
 */
const mockDestinations = [
  {
    destinationId: "DEST-PARIS",
    city: "Paris, France",
    hotels: [
      { id: "HTL-PARIS-01", name: "Le Grand Mirage Palace", rating: 4.9, priceEth: "0.085", priceUsd: 290, image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", roomsAvailable: 4 },
      { id: "HTL-PARIS-02", name: "Eiffel View Boutique Suites", rating: 4.7, priceEth: "0.055", priceUsd: 185, image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", roomsAvailable: 8 }
    ],
    cabs: [
      { id: "CAB-PARIS-LUX", model: "Mercedes-Benz S-Class (Executive)", priceEth: "0.018", priceUsd: 60, etaMinutes: 8 },
      { id: "CAB-PARIS-ECO", model: "Tesla Model Y (Eco Electric)", priceEth: "0.010", priceUsd: 35, etaMinutes: 5 }
    ]
  },
  {
    destinationId: "DEST-TOKYO",
    city: "Tokyo, Japan",
    hotels: [
      { id: "HTL-TOKYO-01", name: "Aman Tokyo Sanctuary", rating: 4.95, priceEth: "0.120", priceUsd: 410, image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", roomsAvailable: 3 },
      { id: "HTL-TOKYO-02", name: "Shinjuku Sky Oasis", rating: 4.6, priceEth: "0.048", priceUsd: 165, image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", roomsAvailable: 12 }
    ],
    cabs: [
      { id: "CAB-TOKYO-ALPHARD", model: "Toyota Alphard VIP Shuttle", priceEth: "0.015", priceUsd: 50, etaMinutes: 7 },
      { id: "CAB-TOKYO-SEDAN", model: "Crown Royal Hybrid Sedan", priceEth: "0.009", priceUsd: 30, etaMinutes: 4 }
    ]
  },
  {
    destinationId: "DEST-ZURICH",
    city: "Zurich, Switzerland",
    hotels: [
      { id: "HTL-ZURICH-01", name: "The Dolder Alpine Grand", rating: 4.9, priceEth: "0.140", priceUsd: 475, image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80", roomsAvailable: 5 },
      { id: "HTL-ZURICH-02", name: "Limmat Waterfront Residence", rating: 4.7, priceEth: "0.075", priceUsd: 255, image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80", roomsAvailable: 6 }
    ],
    cabs: [
      { id: "CAB-ZURICH-SUV", model: "Audi e-tron Quattro Shuttle", priceEth: "0.020", priceUsd: 68, etaMinutes: 6 },
      { id: "CAB-ZURICH-LIM", model: "BMW i7 Electric Sedan", priceEth: "0.024", priceUsd: 82, etaMinutes: 9 }
    ]
  }
];

exports.handler = async (event) => {
  const cityQuery = (event.queryStringParameters && event.queryStringParameters.city) || "";
  console.log(`[Amazon ElastiCache] Checking Redis key 'inventory:destination:${cityQuery || "ALL"}'`);

  // Simulated cache hit / miss logic
  const isCacheHit = true;
  console.log(`[Amazon ElastiCache Redis] Cache ${isCacheHit ? "HIT" : "MISS"}. Latency: 1.8ms`);

  let results = mockDestinations;
  if (cityQuery) {
    results = mockDestinations.filter(d => d.city.toLowerCase().includes(cityQuery.toLowerCase()));
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "X-Cache": "HIT-ElastiCache-Redis"
    },
    body: JSON.stringify({
      source: "ElastiCache-Redis-Cached",
      ttl: 300,
      destinations: results
    })
  };
};
