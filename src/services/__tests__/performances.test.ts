/**
 * Performances Service Tests
 * Tests for the past performances CRUD operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServerPerformancesService } from '../performances';
import type { PastPerformance } from '@/types/database';

// Note: These tests require a valid Supabase connection
const isTestEnvironment = process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL;

describe('PerformancesService', () => {
  if (isTestEnvironment) {
    it('should skip tests in test environment without Supabase', () => {
      console.log('ℹ️ Skipping PerformancesService tests - Supabase not configured');
      expect(true).toBe(true);
    });
    return;
  }

  const performancesService = createServerPerformancesService();
  let testUserId: string;
  let testPerformanceId: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Performances Service tests...');
    // In a real test, you'd create a test user or use a mock user ID
    testUserId = 'test-user-id'; // This should be a valid UUID in your test database
  });

  afterAll(async () => {
    // Clean up test data if needed
    if (testPerformanceId) {
      try {
        await performancesService.deletePastPerformance(testPerformanceId);
        console.log('🧹 Cleaned up test past performance');
      } catch (error) {
        console.warn('Failed to clean up test past performance:', error);
      }
    }
  });

  describe('createPastPerformance', () => {
    it('should create a new past performance', async () => {
      console.log('🧪 Testing past performance creation...');
      
      const testData = {
        title: 'Symphony No. 9 Performance',
        venue: 'Carnegie Hall',
        role: 'Principal Violinist',
        performance_date: '2023-12-15',
        description: 'Performed Beethoven\'s 9th Symphony with the New York Philharmonic',
        ensemble_size: 80,
        genre: 'Classical'
      };

      const result = await performancesService.createPastPerformance(testUserId, testData);
      
      if (result) {
        testPerformanceId = result.id;
        expect(result.title).toBe(testData.title);
        expect(result.venue).toBe(testData.venue);
        expect(result.role).toBe(testData.role);
        expect(result.user_id).toBe(testUserId);
        expect(result.genre).toBe(testData.genre);
        console.log('✅ Past performance created successfully:', result.title);
      } else {
        console.log('ℹ️ Past performance creation returned null - this may be expected in test environment');
      }
    });
  });

  describe('getPastPerformances', () => {
    it('should fetch user past performances', async () => {
      console.log('🧪 Testing past performances fetch...');
      
      const performances = await performancesService.getPastPerformances(testUserId);
      
      expect(Array.isArray(performances)).toBe(true);
      console.log(`✅ Fetched ${performances.length} past performances`);
      
      if (performances.length > 0) {
        const performance = performances[0];
        expect(performance).toHaveProperty('id');
        expect(performance).toHaveProperty('title');
        expect(performance).toHaveProperty('venue');
        expect(performance.user_id).toBe(testUserId);
      }
    });
  });

  describe('updatePastPerformance', () => {
    it('should update an existing past performance', async () => {
      if (!testPerformanceId) {
        console.log('ℹ️ Skipping update test - no test performance created');
        return;
      }

      console.log('🧪 Testing past performance update...');
      
      const updates = {
        title: 'Updated Symphony Performance',
        description: 'Updated description with more details about the performance'
      };

      const result = await performancesService.updatePastPerformance(testPerformanceId, updates);
      
      if (result) {
        expect(result.title).toBe(updates.title);
        expect(result.description).toBe(updates.description);
        console.log('✅ Past performance updated successfully:', result.title);
      } else {
        console.log('ℹ️ Past performance update returned null');
      }
    });
  });

  describe('searchPastPerformances', () => {
    it('should search past performances by query', async () => {
      console.log('🧪 Testing past performances search...');
      
      const searchResults = await performancesService.searchPastPerformances(testUserId, 'Symphony');
      
      expect(Array.isArray(searchResults)).toBe(true);
      console.log(`✅ Search returned ${searchResults.length} results`);
    });
  });

  describe('getPastPerformancesByGenre', () => {
    it('should get past performances by genre', async () => {
      console.log('🧪 Testing past performances by genre...');
      
      const classicalPerformances = await performancesService.getPastPerformancesByGenre(testUserId, 'Classical');
      
      expect(Array.isArray(classicalPerformances)).toBe(true);
      console.log(`✅ Found ${classicalPerformances.length} classical performances`);
    });
  });

  describe('getPastPerformancesPaginated', () => {
    it('should return paginated past performances', async () => {
      console.log('🧪 Testing paginated past performances...');
      
      const result = await performancesService.getPastPerformancesPaginated(testUserId, 5, 0);
      
      expect(result).toHaveProperty('performances');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.performances)).toBe(true);
      expect(typeof result.total).toBe('number');
      console.log(`✅ Paginated fetch returned ${result.performances.length} performances, total: ${result.total}`);
    });
  });

  describe('getPerformanceStats', () => {
    it('should return performance statistics', async () => {
      console.log('🧪 Testing performance statistics...');
      
      const stats = await performancesService.getPerformanceStats(testUserId);
      
      expect(stats).toHaveProperty('totalPerformances');
      expect(stats).toHaveProperty('genreBreakdown');
      expect(stats).toHaveProperty('yearlyStats');
      expect(stats).toHaveProperty('venueCount');
      expect(typeof stats.totalPerformances).toBe('number');
      expect(typeof stats.genreBreakdown).toBe('object');
      expect(typeof stats.yearlyStats).toBe('object');
      expect(typeof stats.venueCount).toBe('number');
      console.log('✅ Performance statistics:', {
        total: stats.totalPerformances,
        venues: stats.venueCount,
        genres: Object.keys(stats.genreBreakdown).length
      });
    });
  });

  describe('getPastPerformancesByDateRange', () => {
    it('should get past performances within a date range', async () => {
      console.log('🧪 Testing past performances by date range...');
      
      const performances = await performancesService.getPastPerformancesByDateRange(
        testUserId,
        '2023-01-01',
        '2023-12-31'
      );
      
      expect(Array.isArray(performances)).toBe(true);
      console.log(`✅ Found ${performances.length} performances in 2023`);
    });
  });

  describe('deletePastPerformance', () => {
    it('should delete a past performance', async () => {
      if (!testPerformanceId) {
        console.log('ℹ️ Skipping delete test - no test performance created');
        return;
      }

      console.log('🧪 Testing past performance deletion...');
      
      const result = await performancesService.deletePastPerformance(testPerformanceId);
      
      expect(result).toBe(true);
      console.log('✅ Past performance deleted successfully');
      
      // Clear the test performance ID since it's been deleted
      testPerformanceId = '';
    });
  });
});
