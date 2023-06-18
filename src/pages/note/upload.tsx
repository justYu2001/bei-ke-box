import type { NextPage, GetServerSideProps } from "next";
import { useRouter } from "next/router";

import { useRef, useState } from "react";
import type {
    ChangeEvent,
    DragEvent,
    FormEvent,
    MouseEvent,
    ReactNode,
} from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import { useForm } from "react-hook-form";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { BsImage, BsFillFileEarmarkXFill } from "react-icons/bs";
import {
    IoIosArrowDown,
    IoIosArrowBack,
    IoIosArrowForward,
    IoIosArrowUp,
} from "react-icons/io";
import { MdCloudUpload, MdEdit } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import { Document, Page } from "react-pdf";
import type { OnDocumentLoadSuccess } from "react-pdf/dist/cjs/shared/types";
import { useAccount } from "wagmi";
import { z } from "zod";

import type { Course } from "@prisma/client";
import type { NewNoteApiSuccessResponse } from "@/pages/api/notes";
import { getServerAuthSession } from "@/server/auth";
import { api } from "@/utils/api";

const newNoteSchema = z.object({
    files: z.custom<FileList>((value) => value instanceof FileList && value.length === 1),
    authorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    name: z.string().min(1),
    courseId: z.string().regex(/^(?!0$).{1,}$/),
    price: z
        .string()
        .min(1)
        .transform((value) => Number.parseFloat(value)),
    description: z.string(),
});

type NewNote = z.infer<typeof newNoteSchema>;

const NewNotePage: NextPage = () => {
    const router = useRouter();

    const { address, isDisconnected } = useAccount();

    if (isDisconnected) {
        void router.push(`/wallet?redirectTo=${router.pathname}`);
    }

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<NewNote>({
        resolver: zodResolver(newNoteSchema),
    });

    const { addNote, isUploading, isSuccess } = useAddNote();

    const handleFormSubmit = (event: FormEvent) => {
        event.preventDefault();

        void handleSubmit(async (data) => {
            const formData = getFormData(data);
            await addNote(formData);
            void router.push("/account/store");
        })();
    };

    const handleCourseChange = (course: Course) => {
        setValue("courseId", course.id);
    };

    return (
        <main className="mx-auto w-2/5 min-w-[600px] pt-2 tracking-wide">
            <h1 className="my-2 text-4xl font-medium">上傳新筆記</h1>

            <p className="my-6 text-sm text-slate-500">
                <RedAsterisk />
                必填欄位
            </p>

            <form method="POST" onSubmit={handleFormSubmit}>
                <FileUploader
                    register={register("files")}
                    error={errors.files}
                />

                <NameInput register={register("name")} error={errors.name} />

                <CourseListbox
                    register={register("courseId")}
                    error={errors.courseId}
                    onChange={handleCourseChange}
                />

                <PriceInput register={register("price")} error={errors.price} />

                <DescriptionInput register={register("description")} />

                <input
                    type="hidden"
                    {...register("authorAddress")}
                    defaultValue={address}
                />

                <button
                    disabled={isUploading || isSuccess}
                    className="float-right my-10 rounded-md bg-amber-400 px-5 py-1.5 font-medium text-white disabled:bg-amber-400/70"
                >
                    新增
                </button>
            </form>
        </main>
    );
};

export default NewNotePage;

export const getServerSideProps: GetServerSideProps = async (context) => {
    const session = await getServerAuthSession(context);

    if (!session) {
        return {
            redirect: {
                destination: "/signin",
                permanent: false,
            },
        };
    }

    return {
        props: {
            user: session.user,
        }
    };
};

const getFormData = (data: NewNote) => {
    const formData = new FormData();

    for (const [key, value] of Object.entries(data)) {
        if (key === "files") {
            const fileList = value as FileList;
            formData.append("file", fileList[0] as File);
        } else {
            formData.append(key, value as string);
        }
    }

    return formData;
};

const useAddNote = () => {
    const [progressPercentage, setProgressPercentage] = useState(0);

    const addNote = (formData: FormData) => {
        return addNewNote(formData, (event) => {
            const totalSize = event.total as number;

            const progress = Math.floor((event.loaded / totalSize) * 100);

            setProgressPercentage(progress);
        });
    };

    const { isLoading, isSuccess, isError, mutateAsync, error } = useMutation(addNote);

    return {
        isUploading: isLoading,
        isFileUploading: isLoading && progressPercentage < 100,
        isSuccess,
        isError,
        addNote: mutateAsync,
        progressPercentage,
        error,
    };
};

const addNewNote = async (
    formData: FormData,
    handleUploadProgress: AxiosRequestConfig["onUploadProgress"]
) => {
    const requestConfig: AxiosRequestConfig = {
        headers: {
            "Content-Type": "multipart/form-data",
        },
        onUploadProgress: handleUploadProgress,
    };

    const { data } = await axios.post<NewNoteApiSuccessResponse>(
        "/api/notes",
        formData,
        requestConfig
    );

    return data;
};

interface FileUploaderProps {
    register: UseFormRegisterReturn;
    error: FieldError | undefined;
}

const FileUploader = ({ register, error }: FileUploaderProps) => {
    const { ref, onChange, ...remainRegister } = register;

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const fileInputRefCallback = (element: HTMLInputElement | null) => {
        ref(element);
        fileInputRef.current = element;
    };

    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isInvalidFileFormat, setIsInvalidFileFormat] = useState(false);

    const handleFileDrop = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();

        const { files } = event.dataTransfer;

        if (fileInputRef.current && isPDF(files)) {
            fileInputRef.current.files = files;

            const changeEvent = new Event("change", {
                bubbles: true,
            });

            fileInputRef.current.dispatchEvent(changeEvent);
        }

        setIsDraggingOver(false);
        setIsInvalidFileFormat(false);
    };

    const handleDragEnter = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();

        setIsDraggingOver(true);

        /**
         * Since `onDragOver` and `onDragEnter` don't have the permission to get file data,
         * so we need to get file type by the property `items`.
         */
        setIsInvalidFileFormat(!isPDF(event.dataTransfer.items));
    };

    const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
        event.preventDefault();

        setIsDraggingOver(false);
        setIsInvalidFileFormat(false);
    };

    const disableDefaultBehavior = (event: DragEvent) => event.preventDefault();

    const [file, setFile] = useState<File>();

    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const newFiles = event.currentTarget.files;

        if (newFiles && newFiles[0]) {
            setFile(newFiles[0]);
            void onChange(event);
        }
    };

    const deleteFile = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (fileInputRef.current && file) {
            setFile(undefined);
            fileInputRef.current.value = "";
        }
    };

    return (
        <>
            <Label htmlFor="note-file">
                <Label.Title required>筆記檔案</Label.Title>
                <Label.Description>支援的檔案類型：PDF</Label.Description>
            </Label>

            <label
                onDrop={handleFileDrop}
                onDrag={disableDefaultBehavior}
                onDragEnter={handleDragEnter}
                onDragOver={disableDefaultBehavior}
                onDragLeave={handleDragLeave}
                htmlFor="note-file"
                onClick={(event) => file && event.preventDefault()}
                className={`group relative flex flex-col items-center justify-center rounded-md border-4 ${
                    file ? "h-[600px] border-none" : "h-96 cursor-pointer"
                } ${isInvalidFileFormat ? "border-red-600 bg-red-300" : ""} ${
                    isDraggingOver && !isInvalidFileFormat ? "bg-slate-100" : ""
                }  ${
                    !isDraggingOver && !isInvalidFileFormat
                        ? "border-dashed border-slate-300"
                        : ""
                }`}
            >
                <div
                    className={`absolute right-0 top-0 z-50 opacity-0 ${
                        file ? "group-hover:opacity-100" : ""
                    }`}
                >
                    <button disabled={!file} onClick={deleteFile}>
                        <RxCross2 className="text-xl text-slate-400 hover:text-red-500" />
                    </button>

                    <label
                        htmlFor="note-file"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <MdEdit className="cursor-pointer text-xl text-slate-400 hover:text-amber-400" />
                    </label>
                </div>

                <input
                    id="note-file"
                    type="file"
                    ref={fileInputRefCallback}
                    accept="application/pdf"
                    {...remainRegister}
                    onChange={handleFilesChange}
                    onClick={(event) => event.stopPropagation()}
                    className="hidden"
                />

                {file ? (
                    <PDFViewer file={file} />
                ) : (
                    <FileUploaderHint
                        isDraggingOver={isDraggingOver}
                        isInvalidFileFormat={isInvalidFileFormat}
                    />
                )}
            </label>

            <p
                className={`mt-2.5 text-sm text-red-500 ${
                    error ? "" : "invisible"
                }`}
            >
                {error ? "請選擇要上傳的筆記檔案" : "error"}
            </p>
        </>
    );
};

const isPDF = (fileList: FileList | DataTransferItemList) => {
    for (let i = 0; i < fileList.length; i++) {
        const type = fileList instanceof DataTransferItemList ? fileList[0]?.type : fileList.item(0)?.type;

        if (type !== "application/pdf") {
            return false;
        }
    }

    return true;
};

interface PDFViewerProps {
    file: File;
}

const PDFViewer = ({ file }: PDFViewerProps) => {
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
        <div className={`group relative ${isLoading ? "animate-pulse" : ""}`}>
            {isLoading && (
                <div className="absolute inset-0 z-50 bg-slate-200" />
            )}

            <Document
                file={file}
                loading=""
                onLoad={handlePDFLoad}
                onLoadSuccess={handlePDFLoadSuccess}
                className="shadow-md"
            >
                <Page
                    pageNumber={pageNumber}
                    height={600}
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

interface FileUploaderHintProps {
    isDraggingOver: boolean;
    isInvalidFileFormat: boolean;
}

const FileUploaderHint = ({
    isDraggingOver,
    isInvalidFileFormat,
}: FileUploaderHintProps) => {
    if (isInvalidFileFormat) {
        return (
            <>
                <BsFillFileEarmarkXFill className="text-6xl text-red-600" />
                <p className="mt-1.5 text-red-600">
                    我們只支援 PDF 檔案，請確認上傳的檔案格式是否正確
                </p>
            </>
        );
    }

    if (isDraggingOver) {
        return (
            <>
                <MdCloudUpload className="animate-bounce text-6xl text-slate-400" />
                <p className="mt-1 text-slate-400">上傳檔案</p>
            </>
        );
    }

    return (
        <>
            <BsImage className="text-6xl text-slate-400" />
            <p className="mt-1 text-slate-400">拖曳或點擊上傳檔案</p>
        </>
    );
};

interface NameInputProps {
    register: UseFormRegisterReturn;
    error: FieldError | undefined;
}

const NameInput = ({ register, error }: NameInputProps) => {
    return (
        <div className="my-2">
            <Label htmlFor="name">
                <Label.Title required>名稱</Label.Title>
            </Label>

            <input
                type="text"
                id="name"
                {...register}
                className="w-full rounded-md border-2 border-slate-300 p-2 transition-colors duration-300 focus:border-orange-400"
            />

            <p
                className={`mt-2 text-sm text-red-500 ${
                    error ? "" : "invisible"
                }`}
            >
                {error ? "請輸入筆記的名稱" : "error"}
            </p>
        </div>
    );
};

const defaultCourse: Course = {
    id: "0",
    year: 0,
    semester: 0,
    name: "請選擇所屬課程",
};

interface CourseListboxProps {
    register: UseFormRegisterReturn;
    error: FieldError | undefined;
    onChange: (course: Course) => void;
}

const CourseListbox = ({ register, error, onChange }: CourseListboxProps) => {
    const { data: courses } = api.accounts.fetchCourses.useQuery();

    const [currentCourse, setCurrentCourse] = useState(defaultCourse);

    const handleCourseOptionClick = (index: number) => {
        return () => {
            const selectedCourse = filteredCourses[index];

            if (selectedCourse) {
                setCurrentCourse(selectedCourse);
                onChange(selectedCourse);
            }
        };
    };

    const [keyword, setKeyword] = useState<string | undefined>();

    let filteredCourses: Course[] = courses ?? [];

    if (keyword) {
        filteredCourses = courses?.filter(({ name }) => name.includes(keyword)) ?? [];
    }

    return (
        <div className="my-2">
            <Label htmlFor="course">
                <Label.Title required>所屬課程</Label.Title>
            </Label>

            <div className="group relative">
                <button
                    onClick={(event) => event.preventDefault()}
                    onBlur={() => setKeyword(undefined)}
                    className="flex w-full items-center rounded-md border-2 border-slate-300 p-2"
                >
                    <input type="hidden" {...register} />
                    <input
                        type="text"
                        value={
                            keyword === undefined ? currentCourse.name : keyword
                        }
                        onChange={(event) =>
                            setKeyword(event.currentTarget.value)
                        }
                        className="flex-1"
                    />
                    <IoIosArrowDown className="text-lg group-focus-within:hidden" />
                    <IoIosArrowUp className="hidden text-lg group-focus-within:block" />
                </button>

                <ul className="absolute inset-x-0 top-12 hidden max-h-60 overflow-y-scroll rounded-md bg-white shadow-md group-focus-within:block">
                    {filteredCourses.map((course, index) => (
                        <li
                            key={course.id}
                            onMouseDown={handleCourseOptionClick(index)}
                            className="flex cursor-pointer justify-between p-3 hover:bg-slate-100"
                        >
                            {course.name}
                            <span className="text-slate-400">
                                {course.year}{" "}
                                {course.semester === 1 ? "上" : "下"}學期
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <p
                className={`mt-2 text-sm text-red-500 ${
                    error ? "" : "invisible"
                }`}
            >
                {error ? "請選擇筆記所屬的課程" : "error"}
            </p>
        </div>
    );
};

interface PriceInputProps {
    register: UseFormRegisterReturn;
    error: FieldError | undefined;
}

const PriceInput = ({ register, error }: PriceInputProps) => {
    return (
        <div className="my-2">
            <Label htmlFor="price">
                <Label.Title required>價格</Label.Title>
            </Label>

            <div className="flex items-center rounded-md border-2 border-slate-300 p-2 transition-colors duration-300 focus-within:border-orange-400">
                <input
                    type="number"
                    step="any"
                    min="0"
                    id="price"
                    {...register}
                    className="flex-1"
                />
                <p className="pr-1 font-medium text-slate-600">ETH</p>
            </div>

            <p
                className={`mt-2 text-sm text-red-500 ${
                    error ? "" : "invisible"
                }`}
            >
                {error ? "請輸入筆記的價格" : "error"}
            </p>
        </div>
    );
};

interface DescriptionInputProps {
    register: UseFormRegisterReturn;
}

const DescriptionInput = ({ register }: DescriptionInputProps) => {
    return (
        <div className="my-2">
            <Label htmlFor="description">
                <Label.Title>描述</Label.Title>
            </Label>

            <textarea
                id="description"
                {...register}
                className="h-40 w-full resize-none rounded-md border-2 border-slate-300 p-2 text-lg"
            />
        </div>
    );
};

interface LabelProps {
    htmlFor: string;
    children: ReactNode;
}

const Label = ({ htmlFor, children }: LabelProps) => {
    return (
        <label
            htmlFor={htmlFor}
            className="my-2.5 block cursor-pointer font-medium"
        >
            {children}
        </label>
    );
};

interface LabelTitleProps {
    required?: boolean;
    children: ReactNode;
}

const LabelTitle = ({ required = false, children }: LabelTitleProps) => {
    return (
        <>
            {children} {required && <RedAsterisk />}
        </>
    );
};

Label.Title = LabelTitle;

const RedAsterisk = () => <span className="text-red-500">* </span>;

interface LabelDescriptionProps {
    children: ReactNode;
}

const LabelDescription = ({ children }: LabelDescriptionProps) => {
    return (
        <p className="mt-1 text-xs font-medium text-slate-500">{children}</p>
    );
};

Label.Description = LabelDescription;
