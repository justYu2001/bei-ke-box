import Link from "next/link";

import type { Course, Note, Teacher, TeachersInCourses, User } from "@prisma/client";

interface NoteCardProps {
    note: Note & {
        course: Course & {
            teachers: (TeachersInCourses & {
                teacher: Teacher;
            })[];
        };
        author: User;
    };
}

const NoteCard = ({ note }: NoteCardProps) => {
    return (
        <li className="rounded-md bg-white px-5 py-4 border border-slate-300 cursor-pointer transition-shadow duration-300 hover:border-transparent hover:shadow-lg">
            <Link href={`/note/${note.id}`}>
                <h3 className="mb-10 text-2xl font-medium">{note.name}</h3>
                <div className="my-3">
                    <h4 className="font-medium">作者</h4>

                    <p className="block mt-0.5 text-slate-400">{note.author.name}</p>
                </div>
                <div className="my-3 flex justify-between">
                    <div>
                        <h4 className="font-medium">課號</h4>
                        <p className="mt-0.5 text-slate-400">
                            {note.course.id}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium">課名</h4>
                        <p className="mt-0.5 text-slate-400">
                            {note.course.name}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium">開課時間</h4>
                        <p className="mt-0.5 text-slate-400">
                            {note.course.year}{" "}
                            {note.course.semester === 1 ? "上" : "下"}學期
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium">授課教授</h4>
                        <p className="mt-0.5 text-slate-400">
                            {note.course.teachers[0]?.teacher.name}
                        </p>
                    </div>
                </div>

                <p className="mt-8 text-lg text-amber-500">
                    {`${note.price} `}
                    <span className="font-medium">ETH</span>
                </p>
            </Link>
        </li>
    );
};

export default NoteCard;