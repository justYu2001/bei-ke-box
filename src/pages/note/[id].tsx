import type { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { getQueryKey } from "@trpc/react-query";
import axios from "axios";
import type { BigNumberish } from "ethers";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Document, Page } from "react-pdf";
import type { OnDocumentLoadSuccess } from "react-pdf/dist/cjs/shared/types";
import { useAccount } from "wagmi";

import type { Course } from "@prisma/client";
import { useBuyNoteToken } from "@/hooks/note-token";
import { api } from "@/utils/api";

const NotePage: NextPage = () => {
    const router = useRouter();

    const id = router.query.id as string | undefined;

    const { data: isOwned } = api.accounts.isOwned.useQuery({
        noteId: id,
    });

    const {
        data: note,
        isLoading: isLoadingNote,
        isError: isFetchingNoteError,
    } = api.notes.fetchNote.useQuery({ id });

    const queryClient = useQueryClient();

    const { mutate, isLoading: isBuying } = api.accounts.buyNote.useMutation({
        onSuccess: () => {
            const queryKey = getQueryKey(api.accounts.isOwned, { noteId: id });
            void queryClient.invalidateQueries({ queryKey });
        },
    });

    const { buyNoteToken, isLoading: isPaying } = useBuyNoteToken({
        onSuccess: () => {
            note && mutate({ noteId: note.id });
        },
    });

    const { isDisconnected } = useAccount();

    const buyNote = () => {
        if (isDisconnected) {
            void router.push(`/wallet?redirectTo=${router.asPath}`);
            return;
        }

        if (note) {
            void buyNoteToken(note.tokenId, note.price);
        }
    };

    const { data: file } = useFetchPdf(note?.id, !isOwned);

    if (isFetchingNoteError) {
        return <p>Error!</p>;
    }

    if (isLoadingNote) {
        return <p>Loading...</p>;
    }

    if (!note) {
        return <p>此筆記不存在</p>;
    }

    return (
        <main className="flex px-10 tracking-wide">
            <div className="flex flex-1 justify-center">
                <PDFViewer file={file} isPreview={!isOwned} />
            </div>

            <div className="flex-1">
                <h1 className="text-4xl font-medium">{note.name}</h1>

                <Link
                    href={`/account/${note.authorId}`}
                    className="mt-1 block text-slate-400 underline-offset-2 hover:underline"
                >
                    {note.author.name}
                </Link>

                {isOwned ? (
                    <DownloadNoteButton file={file} fileName={note.name} />
                ) : (
                    <>
                        <NotePrice price={note.price} />
                        <BuyNoteButton
                            isBuying={isBuying || isPaying}
                            onClick={buyNote}
                        />
                    </>
                )}

                <CourseInformation course={note.course} />

                <NoteDescription description={note.description} />
            </div>
        </main>
    );
};

export default NotePage;

type PdfQueryAction = "preview" | "download";
type PdfQueryContext = QueryFunctionContext<[{ action: PdfQueryAction; id: string }]>;

const useFetchPdf = (id: string | undefined, isPreview: boolean) => {
    const action: PdfQueryAction = isPreview ? "preview" : "download";

    return useQuery([{ action, id: id as string }], fetchPreviewPdf, {
        enabled: !!id,
        staleTime: Infinity,
    });
};

const fetchPreviewPdf = async ({ queryKey: [{ action, id }] }: PdfQueryContext) => {
    const url = `/api/notes/${id}?action=${action}`;

    const { data } = await axios.get<Blob>(url, {
        responseType: "blob",
    });

    const file = new File([data], "");

    return file;
};

interface PDFViewerProps {
    isPreview: boolean;
    file: File | undefined;
}

const PDFViewer = ({ file, isPreview }: PDFViewerProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [numberOfPages, setNumberOfPages] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);

    const handlePDFLoad = () => {
        setIsLoading(true);
    };

    const handlePDFLoadSuccess: OnDocumentLoadSuccess = ({ numPages }) => {
        setNumberOfPages(numPages);
        setPageNumber(1);
        setIsLoading(false);
    };

    const nextPage = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setPageNumber(pageNumber + 1);
    };

    const previousPage = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        setPageNumber(pageNumber - 1);
    };

    return (
        <div
            className={`group relative w-fit ${
                isLoading ? "animate-pulse" : ""
            }`}
        >
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-slate-200" />
            )}

            {pageNumber === numberOfPages && isPreview && <PdfPreviewOverlay />}

            <Document
                file={file}
                loading=""
                onLoad={handlePDFLoad}
                onLoadSuccess={handlePDFLoadSuccess}
                className="h-[700px] w-[495px] shadow-lg"
            >
                <Page
                    pageNumber={pageNumber}
                    height={700}
                    loading=""
                    onLoad={handlePDFLoad}
                />
            </Document>

            <div className="absolute inset-x-0 bottom-4 z-50 flex justify-center">
                <div
                    className={`flex items-center rounded-md bg-white shadow-md transition-opacity duration-300 ${
                        numberOfPages ? "group-hover:opacity-100" : "opacity-0"
                    }`}
                >
                    <button
                        disabled={pageNumber === 1}
                        onClick={previousPage}
                        className="cursor-pointer px-2 py-2 text-lg hover:bg-slate-100 disabled:cursor-auto disabled:bg-white disabled:text-slate-300"
                    >
                        <IoIosArrowBack />
                    </button>
                    <p className="px-2 pb-0.5">第 {pageNumber} 頁</p>
                    <button
                        disabled={pageNumber === numberOfPages}
                        onClick={nextPage}
                        className="cursor-pointer px-2 py-2 text-lg hover:bg-slate-100 disabled:cursor-auto disabled:bg-white disabled:text-slate-300"
                    >
                        <IoIosArrowForward />
                    </button>
                </div>
            </div>
        </div>
    );
};

const PdfPreviewOverlay = () => {
    return (
        <div className="absolute inset-0 z-50 flex items-center">
            <p className="flex h-72 w-full items-center justify-center bg-black/70 text-3xl font-medium text-white">
                購買筆記以解鎖完整內容
            </p>
        </div>
    );
};

interface NotePriceProps {
    price: BigNumberish;
}

const NotePrice = ({ price }: NotePriceProps) => {
    return (
        <>
            <p className="mt-14 text-slate-400">售價</p>
            <p className="mt-1 text-4xl font-medium">{`${price} ETH`}</p>
        </>
    );
};

interface BuyNoteButtonProps {
    isBuying: boolean;
    onClick: () => void;
}

const BuyNoteButton = ({ isBuying, onClick }: BuyNoteButtonProps) => {
    return (
        <button
            disabled={isBuying}
            onClick={onClick}
            className="mt-6 w-80 rounded-md bg-amber-400 py-3 text-xl font-medium text-white"
        >
            購買
        </button>
    );
};

interface DownloadNoteButtonProps {
    fileName: string;
    file: File | undefined;
}

const DownloadNoteButton = ({ file, fileName }: DownloadNoteButtonProps) => {
    const [fileUrl, setFileUrl] = useState<string | undefined>(undefined);

    const [enabled, setEnabled] = useState(false);

    useEffect(() => {
        if (file) {
            setFileUrl(URL.createObjectURL(file));
            setEnabled(true);
        }
    }, [file]);

    return (
        <a
            href={fileUrl}
            download={`${fileName}.pdf`}
            className={`mt-[148px] block w-80 rounded-md text-center ${
                enabled ? "bg-amber-400" : "bg-amber-400/70"
            } py-3 text-xl font-medium text-white`}
        >
            下載
        </a>
    );
};

interface CourseInformationProps {
    course: Course;
}

const CourseInformation = ({ course }: CourseInformationProps) => {
    return (
        <div className="mt-10 border-t-2 border-slate-300 px-1 py-3">
            <h2 className="text-xl font-medium">課程</h2>
            <p className="mt-2">
                {course.id} {course.name}
            </p>
            <p className="mt-0.5 text-slate-400">
                {course.year} {course.semester === 1 ? "上" : "下"}學期
            </p>
        </div>
    );
};

interface NoteDescriptionProps {
    description: string | null;
}

const NoteDescription = ({ description }: NoteDescriptionProps) => {
    const isEmptyDescription = description === null || description === "";

    return (
        <div className="mt-2 border-t-2 border-slate-300 px-1 py-3">
            <h2 className="text-xl font-medium">敘述</h2>
            <pre className="mt-2">
                {isEmptyDescription ? "此筆記無敘述" : description}
            </pre>
        </div>
    );
};
