import { Suspense } from 'react';
import { CodeMirrorEditor } from '../_components/CodeMirrorEditor';
import { CodeBlock } from '../_components/CodeBlock';
import { DiagnosticBox } from '../_components/DiagnosticBox';
import { findTextDiagnostic } from '../_components/diagnosticUtils';

/**
 * Demonstrates suspense boundary opportunity (M4)
 *
 * This scenario shows a route with sequential data fetches that could benefit
 * from parallel Suspense boundaries to enable streaming.
 */

// Simulate async data fetching
async function fetchUserProfile(delay = 1000) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return { name: 'John Doe', email: 'john@example.com' };
}

async function fetchUserPosts(delay = 1500) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return [
    { id: 1, title: 'First Post', content: 'Hello World' },
    { id: 2, title: 'Second Post', content: 'React Server Components' },
  ];
}

async function fetchUserComments(delay = 800) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return [
    { id: 1, postId: 1, text: 'Great post!' },
    { id: 2, postId: 2, text: 'Very informative' },
  ];
}

// ❌ FAULTY: Sequential awaits create a waterfall
// This function is for documentation purposes (shown in code examples)

// ✅ FIXED: Parallel Suspense boundaries enable streaming
async function ProfileSection() {
  const profile = await fetchUserProfile();
  return (
    <div className="rounded-lg bg-blue-50 p-4">
      <h3 className="font-semibold">Profile</h3>
      <p>
        {profile.name} ({profile.email})
      </p>
    </div>
  );
}

async function PostsSection() {
  const posts = await fetchUserPosts();
  return (
    <div className="rounded-lg bg-green-50 p-4">
      <h3 className="font-semibold">Posts ({posts.length})</h3>
      {posts.map((post) => (
        <div key={post.id} className="mt-2">
          <strong>{post.title}</strong>
          <p className="text-sm text-gray-600">{post.content}</p>
        </div>
      ))}
    </div>
  );
}

async function CommentsSection() {
  const comments = await fetchUserComments();
  return (
    <div className="rounded-lg bg-yellow-50 p-4">
      <h3 className="font-semibold">Comments ({comments.length})</h3>
      {comments.map((comment) => (
        <div key={comment.id} className="text-sm text-gray-600">
          {comment.text}
        </div>
      ))}
    </div>
  );
}

function UserDashboardGood() {
  return (
    <div className="space-y-4">
      <Suspense
        fallback={
          <div className="rounded-lg bg-gray-100 p-4 animate-pulse">Loading profile...</div>
        }
      >
        <ProfileSection />
      </Suspense>
      <Suspense
        fallback={<div className="rounded-lg bg-gray-100 p-4 animate-pulse">Loading posts...</div>}
      >
        <PostsSection />
      </Suspense>
      <Suspense
        fallback={
          <div className="rounded-lg bg-gray-100 p-4 animate-pulse">Loading comments...</div>
        }
      >
        <CommentsSection />
      </Suspense>
    </div>
  );
}

const FAULTY_CODE = `async function UserDashboard() {
  // ❌ Sequential awaits - 3.3s total waterfall
  const profile = await fetchUserProfile();   // 1.0s
  const posts = await fetchUserPosts();       // 1.5s (waits for profile)
  const comments = await fetchUserComments(); // 0.8s (waits for posts)
  
  return (
    <div>
      <ProfileDisplay data={profile} />
      <PostsList data={posts} />
      <CommentsList data={comments} />
    </div>
  );
}`;

const FIXED_CODE = `// ✅ Parallel Suspense boundaries - 1.5s max (parallel streaming)
function UserDashboard() {
  return (
    <div>
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileSection />  {/* 1.0s - streams independently */}
      </Suspense>
      
      <Suspense fallback={<PostsSkeleton />}>
        <PostsSection />    {/* 1.5s - streams independently */}
      </Suspense>
      
      <Suspense fallback={<CommentsSkeleton />}>
        <CommentsSection /> {/* 0.8s - streams independently */}
      </Suspense>
    </div>
  );
}

async function ProfileSection() {
  const profile = await fetchUserProfile();
  return <ProfileDisplay data={profile} />;
}

async function PostsSection() {
  const posts = await fetchUserPosts();
  return <PostsList data={posts} />;
}

async function CommentsSection() {
  const comments = await fetchUserComments();
  return <CommentsList data={comments} />;
}`;

export default function SuspenseBoundaryOpportunityPage() {
  // Create mock diagnostics for the interactive editor
  const mockDiagnostics = [
    findTextDiagnostic(
      FAULTY_CODE,
      'const profile = await fetchUserProfile();',
      'warning',
      'Sequential await detected. This creates a data fetching waterfall. Consider wrapping each async operation in a separate Suspense boundary to enable parallel streaming.',
      'rsc-xray'
    ),
    findTextDiagnostic(
      FAULTY_CODE,
      'const posts = await fetchUserPosts();',
      'warning',
      'Sequential await detected. This waits for the previous operation to complete. Use Suspense boundaries to fetch in parallel.',
      'rsc-xray'
    ),
    findTextDiagnostic(
      FAULTY_CODE,
      'const comments = await fetchUserComments();',
      'warning',
      'Sequential await detected. Total waterfall time: 3.3s. With parallel Suspense boundaries, this could complete in 1.5s (the longest individual fetch).',
      'rsc-xray'
    ),
  ].filter((d) => d !== null);

  return (
    <div className="space-y-6 p-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Suspense Boundary Opportunity</h1>
        <p className="text-gray-600">
          Detects sequential data fetches in server components that could be parallelized using
          Suspense boundaries for faster streaming and better perceived performance.
        </p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-300 p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Rule: suspense-boundary-opportunity</h2>
        <p className="text-sm text-blue-800">
          Flags server components with multiple sequential await statements that could benefit from
          parallel Suspense boundaries to enable streaming.
        </p>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Interactive Code Editor</h2>
        <p className="text-sm text-gray-600 mb-3">
          Edit the code below to see how sequential awaits create waterfalls. Hover over the yellow
          underlines to see optimization suggestions.
        </p>
        <CodeMirrorEditor initialValue={FAULTY_CODE} mockDiagnostics={mockDiagnostics} />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Static View (Reference)</h2>
        <CodeBlock code={FAULTY_CODE} title="page.tsx (❌ Waterfall)" highlightLines={[2, 3, 4]} />
      </div>

      <div className="space-y-3">
        <DiagnosticBox
          type="warning"
          title="Sequential data fetching waterfall"
          code="suspense-boundary-opportunity"
          message="This component has 3 sequential await statements, creating a 3.3s waterfall. By wrapping each async operation in a Suspense boundary, they can fetch in parallel and stream as they complete."
          fix="Split into multiple async components, each wrapped in a Suspense boundary"
        />
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Fixed Code (Parallel Streaming)</h2>
        <CodeBlock code={FIXED_CODE} title="page.tsx (✅ Parallel)" />
      </div>

      <div className="rounded-lg bg-green-50 border border-green-300 p-4">
        <h3 className="font-semibold text-green-900 mb-2">Performance Impact</h3>
        <div className="text-sm text-green-800 space-y-2">
          <p>
            <strong>Before (Sequential):</strong> 1.0s + 1.5s + 0.8s = <strong>3.3s total</strong>
          </p>
          <p>
            <strong>After (Parallel):</strong> max(1.0s, 1.5s, 0.8s) = <strong>1.5s total</strong>
          </p>
          <p className="font-semibold mt-2">
            ⚡ Result: <strong>54% faster</strong> (1.8s saved)
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">Why This Matters</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p>
            <strong>Sequential awaits</strong> create a waterfall where each operation must complete
            before the next begins. This is inefficient when fetches are independent.
          </p>
          <p>
            <strong>Suspense boundaries</strong> allow React to start fetching all data sources
            immediately in parallel, then stream each section as it becomes ready. Users see content
            progressively instead of waiting for everything.
          </p>
          <p>
            <strong>Best for:</strong> Dashboard pages, user profiles, product pages - anywhere you
            have multiple independent data sources.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">How the Analyzer Detects This</h2>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Identifies server components with multiple await statements in sequence</li>
          <li>Checks if awaited values are independent (not used in subsequent fetches)</li>
          <li>Calculates potential time savings from parallelization</li>
          <li>Suggests splitting into separate Suspense-wrapped components</li>
        </ul>
      </div>

      <div className="rounded-lg bg-gray-50 border border-gray-300 p-4">
        <h3 className="font-semibold mb-2">Live Demo (Reload to See)</h3>
        <p className="text-sm text-gray-600 mb-4">
          The components below demonstrate the fixed version with parallel Suspense boundaries.
          Reload the page to see how sections stream in independently.
        </p>
        <UserDashboardGood />
      </div>
    </div>
  );
}
