import { AdminBlogReviewPage } from '@/components/features/admin/pages';

export default async function BlogReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return (
      <div className="p-8">
        <p className="text-red-600">Invalid post ID</p>
      </div>
    );
  }

  return <AdminBlogReviewPage postId={postId} />;
}
