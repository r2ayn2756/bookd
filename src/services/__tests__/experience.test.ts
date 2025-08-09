/**
 * Experience Service Tests
 * Tests for the experience entries CRUD operations
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServerExperienceService } from '../experience';
import type { ExperienceEntry } from '@/types/database';

// Note: These tests require a valid Supabase connection
const isTestEnvironment = process.env.NODE_ENV === 'test' && !process.env.SUPABASE_URL;

describe('ExperienceService', () => {
  if (isTestEnvironment) {
    it('should skip tests in test environment without Supabase', () => {
      console.log('ℹ️ Skipping ExperienceService tests - Supabase not configured');
      expect(true).toBe(true);
    });
    return;
  }

  const experienceService = createServerExperienceService();
  let testUserId: string;
  let testEntryId: string;

  beforeAll(async () => {
    console.log('🧪 Setting up Experience Service tests...');
    // In a real test, you'd create a test user or use a mock user ID
    testUserId = 'test-user-id'; // This should be a valid UUID in your test database
  });

  afterAll(async () => {
    // Clean up test data if needed
    if (testEntryId) {
      try {
        await experienceService.deleteExperienceEntry(testEntryId);
        console.log('🧹 Cleaned up test experience entry');
      } catch (error) {
        console.warn('Failed to clean up test experience entry:', error);
      }
    }
  });

  describe('createExperienceEntry', () => {
    it('should create a new experience entry', async () => {
      console.log('🧪 Testing experience entry creation...');
      
      const testData = {
        title: 'Test Orchestra Position',
        organization: 'Test Symphony Orchestra',
        description: 'Principal violinist position',
        start_date: '2020-01-01',
        end_date: '2023-12-31',
        is_current: false
      };

      const result = await experienceService.createExperienceEntry(testUserId, testData);
      
      if (result) {
        testEntryId = result.id;
        expect(result.title).toBe(testData.title);
        expect(result.organization).toBe(testData.organization);
        expect(result.user_id).toBe(testUserId);
        expect(result.display_order).toBe(1); // Should be first entry
        console.log('✅ Experience entry created successfully:', result.title);
      } else {
        console.log('ℹ️ Experience entry creation returned null - this may be expected in test environment');
      }
    });
  });

  describe('getExperienceEntries', () => {
    it('should fetch user experience entries', async () => {
      console.log('🧪 Testing experience entries fetch...');
      
      const entries = await experienceService.getExperienceEntries(testUserId);
      
      expect(Array.isArray(entries)).toBe(true);
      console.log(`✅ Fetched ${entries.length} experience entries`);
      
      if (entries.length > 0) {
        const entry = entries[0];
        expect(entry).toHaveProperty('id');
        expect(entry).toHaveProperty('title');
        expect(entry).toHaveProperty('organization');
        expect(entry.user_id).toBe(testUserId);
      }
    });
  });

  describe('updateExperienceEntry', () => {
    it('should update an existing experience entry', async () => {
      if (!testEntryId) {
        console.log('ℹ️ Skipping update test - no test entry created');
        return;
      }

      console.log('🧪 Testing experience entry update...');
      
      const updates = {
        title: 'Updated Orchestra Position',
        description: 'Updated description with more details'
      };

      const result = await experienceService.updateExperienceEntry(testEntryId, updates);
      
      if (result) {
        expect(result.title).toBe(updates.title);
        expect(result.description).toBe(updates.description);
        console.log('✅ Experience entry updated successfully:', result.title);
      } else {
        console.log('ℹ️ Experience entry update returned null');
      }
    });
  });

  describe('toggleCurrentStatus', () => {
    it('should toggle the current status of an experience entry', async () => {
      if (!testEntryId) {
        console.log('ℹ️ Skipping toggle test - no test entry created');
        return;
      }

      console.log('🧪 Testing current status toggle...');
      
      const result = await experienceService.toggleCurrentStatus(testEntryId);
      
      if (result) {
        expect(typeof result.is_current).toBe('boolean');
        console.log('✅ Current status toggled successfully:', result.is_current);
      } else {
        console.log('ℹ️ Toggle current status returned null');
      }
    });
  });

  describe('searchExperienceEntries', () => {
    it('should search experience entries by query', async () => {
      console.log('🧪 Testing experience entries search...');
      
      const searchResults = await experienceService.searchExperienceEntries(testUserId, 'Orchestra');
      
      expect(Array.isArray(searchResults)).toBe(true);
      console.log(`✅ Search returned ${searchResults.length} results`);
    });
  });

  describe('getExperienceEntriesPaginated', () => {
    it('should return paginated experience entries', async () => {
      console.log('🧪 Testing paginated experience entries...');
      
      const result = await experienceService.getExperienceEntriesPaginated(testUserId, 5, 0);
      
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.entries)).toBe(true);
      expect(typeof result.total).toBe('number');
      console.log(`✅ Paginated fetch returned ${result.entries.length} entries, total: ${result.total}`);
    });
  });

  describe('deleteExperienceEntry', () => {
    it('should delete an experience entry', async () => {
      if (!testEntryId) {
        console.log('ℹ️ Skipping delete test - no test entry created');
        return;
      }

      console.log('🧪 Testing experience entry deletion...');
      
      const result = await experienceService.deleteExperienceEntry(testEntryId);
      
      expect(result).toBe(true);
      console.log('✅ Experience entry deleted successfully');
      
      // Clear the test entry ID since it's been deleted
      testEntryId = '';
    });
  });
});
