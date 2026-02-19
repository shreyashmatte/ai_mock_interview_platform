import Link from "next/link";
import Image from "next/image";

import { Button } from "@/Components/ui/button";
import InterviewCard from "@/Components/InterviewCard";

import {getCurrentUser} from "@/lib/actions/auth.action";

//import {dummyInterviews} from "@/constants";
import {getInterviewsByUserId} from "@/lib/actions/general.action";
import {getLatestInterviews} from "@/lib/actions/general.action";

const Page = async () => {
    const user = await getCurrentUser()

    if (!user) {
        return (
            <div className="p-8">
                <h2>Please log in to view your interviews.</h2>
            </div>
        );
    }
    console.log("Current Logged In User ID:", user.id);

    const [userInterviews = [], latestInterviews = []] = await Promise.all([
        getInterviewsByUserId(user.id),
        getLatestInterviews({ userId: user.id }),
    ]);

    const hasPastInterviews = userInterviews.length > 0;
    const hasUpcomingInterviews = latestInterviews.length > 0;
return (
        <>
            <section className="card-cta">
                <div className="flex flex-col gap-6 max-w-lg">
                    <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
                    <p className="text-lg">
                        Practice real interview questions & get instant feedback
                    </p>

                    <Button asChild className="btn-primary max-sm:w-full">
                        <Link href="/interview">Start an Interview</Link>
                    </Button>
                </div>

                <Image
                    src="/robot.png"
                    alt="robo-dude"
                    width={400}
                    height={400}
                    className="max-sm:hidden"
                />
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Your Interviews</h2>

                <div className="interviews-section">

                    {hasPastInterviews ? (
                        userInterviews?.map((interview) => (
                            <InterviewCard
                                key={interview.id}
                                userId={user.id}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                            />
                        ))
                    ) : (
                        <p>You haven&apos;t taken any interviews yet</p>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Take an Interviews</h2>

                <div className="interviews-section">

                    {hasUpcomingInterviews ? (
                        latestInterviews?.map((interview) => (
                            <InterviewCard
                                key={interview.id}
                                userId={user.id}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                            />
                        ))
                    ) : (
                        <p>There are no interviews available</p>
                    )}                 </div>
            </section>
        </>
    );
}

export default Page;