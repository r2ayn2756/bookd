# Performances Service

The Performances Service provides comprehensive CRUD operations for managing user past performances in the Bookd application.

## Overview

Past performances represent concerts, recitals, gigs, and other musical events that musicians have participated in. Each performance includes details like title, venue, role, date, and genre information to showcase a musician's performance history.

## Features

- ✅ Create, read, update, and delete past performances
- ✅ Search and filter performances by genre, venue, date range
- ✅ Performance statistics and analytics
- ✅ Client-side wrapper with authentication
- ✅ Comprehensive error handling
- ✅ Type-safe with TypeScript

## Usage

### Server-side Service

```typescript
import { createServerPerformancesService } from '@/services/performances';

const performancesService = createServerPerformancesService();

// Get all past performances for a user
const performances = await performancesService.getPastPerformances(userId);

// Create a new past performance
const newPerformance = await performancesService.createPastPerformance(userId, {
  title: 'Symphony No. 9',
  venue: 'Carnegie Hall',
  role: 'Principal Violinist',
  performance_date: '2023-12-15',
  description: 'Performed with the New York Philharmonic',
  ensemble_size: 80,
  genre: 'Classical'
});

// Update a past performance
const updatedPerformance = await performancesService.updatePastPerformance(performanceId, {
  title: 'Beethoven Symphony No. 9',
  description: 'Updated description with conductor details...'
});

// Delete a past performance
const success = await performancesService.deletePastPerformance(performanceId);
```

### Client-side Service

```typescript
import { 
  getCurrentUserPastPerformances,
  createCurrentUserPastPerformance,
  updateCurrentUserPastPerformance,
  deleteCurrentUserPastPerformance,
  getCurrentUserPerformanceStats
} from '@/services/client/performances';

// Get current user's past performances
const performances = await getCurrentUserPastPerformances();

// Create a new performance for current user
const newPerformance = await createCurrentUserPastPerformance({
  title: 'Jazz Festival Performance',
  venue: 'Blue Note',
  role: 'Lead Saxophonist',
  performance_date: '2023-07-04',
  description: 'Headlined the summer jazz festival',
  ensemble_size: 5,
  genre: 'Jazz'
});

// Update with ownership verification
const updated = await updateCurrentUserPastPerformance(performanceId, {
  description: 'Updated with audience feedback and reviews...'
});

// Delete with ownership verification
const deleted = await deleteCurrentUserPastPerformance(performanceId);

// Get performance statistics
const stats = await getCurrentUserPerformanceStats();
console.log('Total performances:', stats.totalPerformances);
console.log('Genres performed:', Object.keys(stats.genreBreakdown));
```

## API Reference

### Core Methods

#### `getPastPerformances(userId: string): Promise<PastPerformance[]>`
Fetches all past performances for a user, ordered by performance date (most recent first).

#### `createPastPerformance(userId: string, data: CreatePastPerformance): Promise<PastPerformance | null>`
Creates a new past performance entry.

#### `updatePastPerformance(performanceId: string, updates: UpdatePastPerformance): Promise<PastPerformance | null>`
Updates an existing past performance with the provided fields.

#### `deletePastPerformance(performanceId: string): Promise<boolean>`
Deletes a past performance entry.

### Advanced Methods

#### `getPastPerformancesPaginated(userId: string, limit?: number, offset?: number)`
Returns paginated past performances with total count.

#### `searchPastPerformances(userId: string, query: string, limit?: number): Promise<PastPerformance[]>`
Searches performances by title, venue, or role.

#### `getPastPerformancesByGenre(userId: string, genre: string): Promise<PastPerformance[]>`
Gets all performances of a specific genre.

#### `getPastPerformancesByDateRange(userId: string, startDate: string, endDate: string): Promise<PastPerformance[]>`
Filters performances within a date range.

#### `getPerformanceStats(userId: string): Promise<PerformanceStats>`
Returns comprehensive statistics including genre breakdown, yearly stats, and venue count.

## Data Structure

### PastPerformance

```typescript
interface PastPerformance {
  id: string;                    // UUID
  user_id: string;              // UUID, FK to users
  title: string;                // Performance title
  venue: string | null;         // Venue name
  role: string | null;          // Musician's role
  performance_date: string | null; // ISO date string
  description: string | null;   // Detailed description
  ensemble_size: number | null; // Number of performers
  genre: string | null;         // Music genre
  created_at: string;           // ISO timestamp
  updated_at: string;           // ISO timestamp
}
```

### CreatePastPerformance

```typescript
type CreatePastPerformance = Omit<PastPerformance, 'id' | 'created_at' | 'updated_at'>;
```

### UpdatePastPerformance

```typescript
type UpdatePastPerformance = Partial<Omit<PastPerformance, 'id' | 'created_at' | 'updated_at'>>;
```

### Performance Statistics

```typescript
interface PerformanceStats {
  totalPerformances: number;
  genreBreakdown: Record<string, number>;  // Genre -> count
  yearlyStats: Record<string, number>;     // Year -> count
  venueCount: number;                      // Unique venues
}
```

## Error Handling

The service includes comprehensive error handling:

- **Authentication errors**: Client methods verify user authentication
- **Authorization errors**: Client methods verify ownership before modifications
- **Database errors**: All database operations are wrapped in try-catch blocks
- **Validation errors**: Input validation for required fields
- **Network errors**: Graceful handling of Supabase connection issues

## Security Features

- **Row Level Security (RLS)**: Database policies ensure users can only access their own data
- **Ownership verification**: Client methods verify user owns the performance before modifications
- **Input sanitization**: All inputs are properly typed and validated
- **Authentication checks**: Client methods require user authentication

## Best Practices

1. **Use client methods for frontend components** - They include authentication and ownership checks
2. **Use server methods for API routes** - They provide more control and can bypass RLS when needed
3. **Handle null returns** - Methods return null when operations fail
4. **Check authentication** - Always verify user is authenticated before operations
5. **Validate input** - Ensure required fields are provided before API calls

## Advanced Features

### Performance Analytics

```typescript
// Get genre distribution
const stats = await getCurrentUserPerformanceStats();
const genres = Object.entries(stats.genreBreakdown)
  .sort(([,a], [,b]) => b - a) // Sort by count
  .map(([genre, count]) => ({ genre, count }));

// Get recent activity
const recentPerformances = await getCurrentUserPastPerformancesByDateRange(
  '2023-01-01',
  new Date().toISOString().split('T')[0]
);

// Search performance history
const symphonyPerformances = await searchCurrentUserPastPerformances('symphony');
```

### Performance Filtering

```typescript
// Get all jazz performances
const jazzPerformances = await getCurrentUserPastPerformancesByGenre('Jazz');

// Get performances from specific year
const performances2023 = await getCurrentUserPastPerformancesByDateRange(
  '2023-01-01',
  '2023-12-31'
);

// Paginated loading for large performance lists
const { performances, total } = await getCurrentUserPastPerformancesPaginated(10, 0);
```

## Testing

The service includes comprehensive tests in `__tests__/performances.test.ts`. Tests cover:

- CRUD operations
- Search and filtering
- Performance statistics
- Error handling
- Date range queries

Run tests with:
```bash
npm test src/services/__tests__/performances.test.ts
```

## Integration

The performances service integrates with:

- **Individual Profiles**: Performance entries belong to individual user profiles
- **User Management**: Uses user authentication and authorization
- **Profile Completion**: Performance entries contribute to profile completeness
- **Analytics**: Performance data feeds into user statistics and insights

## Future Enhancements

Potential future improvements:

- **Media attachments**: Support for performance videos, photos, and audio
- **Ratings and reviews**: Allow audience feedback on performances
- **Collaboration tracking**: Link performances to other musicians involved
- **Venue integration**: Rich venue data with location and capacity
- **Social sharing**: Share notable performances on social platforms
- **Performance calendar**: Integration with upcoming events and scheduling
- **Achievement system**: Badges and milestones based on performance history
- **Export functionality**: Generate performance resumes and portfolios
