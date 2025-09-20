import React, { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import { db } from '../firebase';
import { UserProfile, Post } from '../App';
import { ArrowLeftIcon, UserCircleIcon, TrashIcon, HeartIcon, ChatBubbleBottomCenterTextIcon } from '../components/icons';

interface CommunityPageProps {
    user: firebase.User;
    userProfile: UserProfile;
    onBack: () => void;
}

const CommunityPage: React.FC<CommunityPageProps> = ({ user, userProfile, onBack }) => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        setLoading(true);
        const unsubscribe = db.collection('community_posts')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
                setPosts(postsData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching posts:", error);
                setLoading(false);
            });

        return () => unsubscribe();
    }, []);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim() || isPosting) return;

        setIsPosting(true);
        try {
            await db.collection('community_posts').add({
                authorId: user.uid,
                authorName: userProfile.name || user.email || '익명',
                authorProfileImageUrl: userProfile.profileImageUrl || null,
                authorRole: userProfile.role,
                content: newPostContent.trim(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: [],
                commentCount: 0,
            });
            setNewPostContent('');
        } catch (error) {
            console.error("Error creating post:", error);
            alert('게시물을 작성하는 데 실패했습니다.');
        } finally {
            setIsPosting(false);
        }
    };
    
    const handleDeletePost = async (postId: string) => {
        if(window.confirm('정말로 이 게시물을 삭제하시겠습니까?')) {
            try {
                await db.collection('community_posts').doc(postId).delete();
            } catch (error) {
                console.error("Error deleting post:", error);
                alert('게시물을 삭제하는 데 실패했습니다.');
            }
        }
    }

    const timeSince = (date: firebase.firestore.Timestamp | null): string => {
        if (!date) return '방금 전';
        const seconds = Math.floor((new Date().getTime() - date.toDate().getTime()) / 1000);
        if (seconds < 5) return "방금 전";
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "년 전";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "달 전";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "일 전";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "시간 전";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "분 전";
        return Math.floor(seconds) + "초 전";
    };

    return (
        <div className="container mx-auto px-6 py-12">
            <button onClick={onBack} className="flex items-center space-x-2 text-primary mb-6 hover:underline">
                <ArrowLeftIcon className="w-5 h-5" />
                <span>대시보드로 돌아가기</span>
            </button>

            <h1 className="text-3xl font-bold mb-2">커뮤니티</h1>
            <p className="text-gray-400 mb-8">모두와 함께 운동 경험을 공유하고 소통해보세요.</p>
            
            <div className="max-w-2xl mx-auto">
                {/* Create Post Form */}
                <div className="bg-dark-accent p-4 rounded-lg shadow-lg mb-8">
                    <form onSubmit={handleCreatePost} className="flex items-start space-x-4">
                        {userProfile.profileImageUrl ? (
                            <img src={userProfile.profileImageUrl} alt="My Profile" className="w-10 h-10 rounded-full object-cover"/>
                        ) : (
                             <UserCircleIcon className="w-10 h-10 text-gray-500"/>
                        )}
                        <div className="flex-grow">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder={`${userProfile.name || '회원'}님의 소식을 공유해보세요...`}
                                className="w-full bg-dark p-3 rounded-md text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-500 resize-none"
                                rows={3}
                            />
                            <div className="text-right mt-2">
                                <button type="submit" disabled={!newPostContent.trim() || isPosting} className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                                    {isPosting ? '게시 중...' : '게시하기'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Posts Feed */}
                <div className="space-y-6">
                    {loading && <p className="text-center text-gray-400">피드를 불러오는 중...</p>}
                    {!loading && posts.length === 0 && (
                        <div className="text-center text-gray-500 bg-dark-accent p-8 rounded-lg">
                            <p>아직 게시물이 없습니다.</p>
                            <p>첫 번째 게시물을 작성해보세요!</p>
                        </div>
                    )}
                    {posts.map(post => (
                        <div key={post.id} className="bg-dark-accent p-5 rounded-lg shadow-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                    {post.authorProfileImageUrl ? (
                                        <img src={post.authorProfileImageUrl} alt={post.authorName} className="w-11 h-11 rounded-full object-cover"/>
                                    ) : (
                                        <UserCircleIcon className="w-11 h-11 text-gray-500"/>
                                    )}
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <p className="font-bold text-white">{post.authorName}</p>
                                            {post.authorRole === 'trainer' && <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full">트레이너</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">{timeSince(post.createdAt)}</p>
                                    </div>
                                </div>
                                {post.authorId === user.uid && (
                                     <button onClick={() => handleDeletePost(post.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-300 my-4 whitespace-pre-wrap">{post.content}</p>
                            <div className="flex items-center space-x-6 text-gray-400 border-t border-gray-700/50 pt-2">
                                <button className="flex items-center space-x-2 hover:text-red-500 transition-colors">
                                    <HeartIcon className="w-5 h-5"/>
                                    <span className="text-sm">좋아요</span>
                                </button>
                                <button className="flex items-center space-x-2 hover:text-primary transition-colors">
                                    <ChatBubbleBottomCenterTextIcon className="w-5 h-5"/>
                                    <span className="text-sm">댓글</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommunityPage;
