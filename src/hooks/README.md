# Profile Data Management Hooks

This directory contains React hooks for managing individual profile data with comprehensive loading states, error handling, and data synchronization.

## Core Hooks

### `useProfile()`
Manages current user's profile data with auto-creation of individual profiles.

```tsx
import { useProfile } from '@/hooks';

function ProfileComponent() {
  const { profile, loading, error, isComplete, refetch } = useProfile();
  
  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>{profile?.individual_profile?.stage_name}</h1>
      <p>Profile {isComplete ? 'Complete' : 'Incomplete'}</p>
    </div>
  );
}
```

### `useUserProfile(userId)`
Manages any user's profile data by ID.

```tsx
import { useUserProfile } from '@/hooks';

function UserProfileCard({ userId }: { userId: string }) {
  const { profile, loading, error } = useUserProfile(userId);
  
  if (loading) return <div>Loading...</div>;
  if (!profile) return <div>User not found</div>;
  
  return <div>{profile.full_name}</div>;
}
```

### `useUpdateProfile()`
Handles profile updates with optimistic updates and error handling.

```tsx
import { useUpdateProfile } from '@/hooks';

function EditProfileForm() {
  const { updateProfile, state } = useUpdateProfile();
  
  const handleSave = async () => {
    const result = await updateProfile(
      { stage_name: 'New Name' },
      {
        onSuccess: (profile) => console.log('Updated!', profile),
        onError: (error) => console.error('Failed:', error)
      }
    );
  };
  
  return (
    <button onClick={handleSave} disabled={state.loading}>
      {state.loading ? 'Saving...' : 'Save Profile'}
    </button>
  );
}
```

## Advanced Hooks

### `useProfileData()`
Combines profile fetching and updating with completion tracking.

```tsx
import { useProfileData } from '@/hooks';

function ProfileDashboard() {
  const {
    profile,
    loading,
    updating,
    completionPercentage,
    missingFields,
    updateProfile
  } = useProfileData();
  
  return (
    <div>
      <h2>Profile Completion: {completionPercentage}%</h2>
      {missingFields.length > 0 && (
        <p>Missing: {missingFields.join(', ')}</p>
      )}
      <button 
        onClick={() => updateProfile({ stage_name: 'New Name' })}
        disabled={updating}
      >
        {updating ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
}
```

### `useProfileCompletion()`
Manages step-by-step profile completion workflow.

```tsx
import { useProfileCompletion } from '@/hooks';

function ProfileSetupWizard() {
  const {
    steps,
    currentStep,
    currentStepData,
    progressPercentage,
    goToNextStep,
    goToPreviousStep,
    completeStep
  } = useProfileCompletion();
  
  return (
    <div>
      <div>Progress: {progressPercentage}%</div>
      <h2>{currentStepData.title}</h2>
      <p>{currentStepData.description}</p>
      
      <button onClick={goToPreviousStep}>Previous</button>
      <button onClick={goToNextStep}>Next</button>
    </div>
  );
}
```

### `useProfileForm()`
Manages form state with dirty tracking and submission.

```tsx
import { useProfileForm } from '@/hooks';

function ProfileEditForm({ initialData }) {
  const {
    formData,
    updateField,
    submitForm,
    isDirty,
    isSubmitting
  } = useProfileForm(initialData);
  
  return (
    <form onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
      <input
        value={formData.stage_name || ''}
        onChange={(e) => updateField('stage_name', e.target.value)}
      />
      <button type="submit" disabled={!isDirty || isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

## Utility Hooks

### `useNotifications()`
Manages toast notifications and user feedback.

```tsx
import { useNotifications } from '@/hooks';

function SomeComponent() {
  const { showSuccess, showError, notifications } = useNotifications();
  
  const handleAction = async () => {
    try {
      await someApiCall();
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError('Failed to update profile', error.message);
    }
  };
  
  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id} className={notification.type}>
          {notification.title}
        </div>
      ))}
    </div>
  );
}
```

### `useAsyncOperation()`
Manages async operations with loading states.

```tsx
import { useAsyncOperation } from '@/hooks';

function DataComponent() {
  const { loading, data, error, execute } = useAsyncOperation();
  
  const loadData = () => {
    execute(
      () => fetch('/api/data').then(r => r.json()),
      (data) => console.log('Success:', data),
      (error) => console.error('Error:', error)
    );
  };
  
  return (
    <div>
      <button onClick={loadData} disabled={loading}>
        {loading ? 'Loading...' : 'Load Data'}
      </button>
      {error && <div>Error: {error}</div>}
      {data && <div>Data: {JSON.stringify(data)}</div>}
    </div>
  );
}
```

## Validation Hooks

### `useProfileValidation()`
Provides field-level validation for profile forms.

```tsx
import { useProfileValidation } from '@/hooks';

function ValidatedProfileForm() {
  const { errors, validateField, hasErrors } = useProfileValidation();
  const [stageName, setStageName] = useState('');
  
  const handleStageNameChange = (value: string) => {
    setStageName(value);
    validateField('stage_name', value);
  };
  
  return (
    <div>
      <input
        value={stageName}
        onChange={(e) => handleStageNameChange(e.target.value)}
      />
      {errors.stage_name && (
        <div className="error">{errors.stage_name}</div>
      )}
    </div>
  );
}
```

## Best Practices

1. **Use `useProfileData()` for most profile operations** - it combines multiple hooks for convenience
2. **Implement optimistic updates** for better UX using the `optimistic` option in `useUpdateProfile()`
3. **Handle loading states** - always show loading indicators during async operations
4. **Use validation hooks** to provide real-time feedback to users
5. **Implement error boundaries** to catch and handle unexpected errors gracefully
6. **Use debouncing** for search inputs and real-time validation with `useDebounce()`

## Error Handling

All hooks include comprehensive error handling:
- Network errors are caught and exposed via error states
- Validation errors are handled at the field level
- Success states are provided for user feedback
- Automatic retries can be implemented using the refetch functions

## Performance Considerations

- Hooks use `useCallback` and `useMemo` to prevent unnecessary re-renders
- Profile data is cached and only refetched when necessary
- Optimistic updates provide immediate feedback while reducing server calls
- Debouncing prevents excessive API calls during user input