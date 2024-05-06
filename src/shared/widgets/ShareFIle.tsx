import React, { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { filesize } from "filesize";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "@/shared/libs/config/firebase";
import axios from "axios";
import { ArrowLeft, Copy, Trash, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

type T_selectedFile = Blob & {
  name: string;
  size: number;
  type: string;
};

type ShareFileProps = {
  setOperation: React.Dispatch<React.SetStateAction<string>>;
  Operation: string;
};

const ShareFile: React.FC<ShareFileProps> = ({ setOperation, Operation }) => {
  const [selectedFile, setSelectedFile] = useState<T_selectedFile | null>(null);
  const [secretCode, setSecretCode] = useState("");
  const [SplitCode, setSplitCode] = useState<string[]>([]);
  const [width, setWidth] = useState(0);
  const [loader, setLoader] = useState(false);
  const storage = getStorage(app);
  const { toast }: any = useToast();

  const handleUploadFile = async (downloadURL: string) => {
    if (!selectedFile || !downloadURL)
      return toast({
        variant: "destructive",
        description: "No file exists, Please Re-upload file",
      });
    try {
      const ReqData = {
        fileData: downloadURL,
        fileName: selectedFile?.name,
      };
      const res = await axios.post("/api/storefile", ReqData);
      setSecretCode(res.data.code);
      setSplitCode(res.data.code.toString().split(""));
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Upload  failed",
      });
    }
  };

  const UploadFile = (file: T_selectedFile) => {
    setLoader(true);
    try {
      const metadata = {
        contentType: file.type,
      };
      const storageRef = ref(storage, "file-upload/" + file?.name);
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setWidth(progress === 0 ? 5 : progress);
        },
        (error) => {
          toast({
            variant: "destructive",
            description: "Upload failed",
          });
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            handleUploadFile(downloadURL);
            setLoader(false);
          });
        }
      );
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Upload failed",
      });
      setLoader(false);
    }
  };

  const CopyURL = async () => {
    if (!secretCode) return;
    toast({
      description: "Code Copied to the clipboard",
    });
    await window.navigator.clipboard.writeText(secretCode);
  };

  return (
    <Card className="w-[350px]  shadow-lg shadow-black dark:border-slate-500  ">
      <CardHeader>
        <CardTitle>Share {selectedFile ? "this" : "a"} File</CardTitle>
      </CardHeader>
      <CardFooter className=" flex flex-col ">
        {selectedFile?.name ? (
          <>
            <div className="  bg-slate-100 shadow shadow-slate-200 dark:shadow-none dark:bg-gray-900   w-full py-2 px-4 rounded ">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="font-bold">{selectedFile?.name}</h1>
                  <span className=" text-sm ">
                    {filesize(selectedFile?.size, { standard: "jedec" })}
                  </span>
                </div>
                <span
                  className={`${width == 0 ? "block" : "hidden"}`}
                  onClick={() => {
                    setSelectedFile(null);
                    setOperation("none");
                    setWidth(0);
                  }}
                >
                  <Trash className="  hover:opacity-50 duration-300 text-slate-200 cursor-pointer" />
                </span>
              </div>
            </div>
            <div className=" my-3">
              {!loader && width == 0 && (
                <Button
                  onClick={() => UploadFile(selectedFile)}
                  className=" mt-5 gap-x-2 flex items-center"
                >
                  <span>Upload</span>
                  <Upload className=" h-4 w-4" />
                </Button>
              )}
              {loader ? (
                <div className=" w-full">
                  <Progress value={width} className=" min-w-60" />
                  <div className=" flex gap-x-2 my-3 items-center">
                    <span>{width.toFixed(0)}%</span>
                    <h3 className=" h-4 w-4 border-2 border-black dark:border-white   dark:border-t-transparent border-t-transparent rounded-full animate-spin"></h3>
                  </div>
                </div>
              ) : (
                ""
              )}
              {!secretCode ? (
                width == 100 && <h1>Upload Succes</h1>
              ) : (
                <div className=" mt-6">
                  <h4 className=" text-sm">
                    Share this Secret code for the file access{" "}
                  </h4>
                  <div className="  mt-4 w-full flex flex-col items-center">
                    <div className=" flex">
                      {SplitCode.map((item, i) => {
                        return (
                          <h1
                            key={i}
                            className="  text-2xl border-slate-400 px-4 py-1 rounded border"
                          >
                            {item}
                          </h1>
                        );
                      })}
                    </div>
                    <Button
                      onClick={CopyURL}
                      className=" border-slate-400 flex items-center gap-x-1 mt-4   "
                    >
                      <span>Copy</span>
                      <Copy className=" h-4 w-4 " />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <label className="flex flex-col items-center border border-slate-500 rounded-md  w-full p-5 mx-auto mt-2 text-center  cursor-pointer ">
            <Upload className=" text-slate-500" />
            <p className="mt-2 text-sm tracking-wide text-gray-500 ">
              Upload your file
            </p>
            <input
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const { files } = e.target;
                if (!files) return;
                setSelectedFile(files[0]!);
                setOperation("upload");
              }}
              type="file"
              className="hidden"
            />
          </label>
        )}
      </CardFooter>
      <CardFooter
        className={` 
        ${width == 0 || width == 100 ? "block" : "hidden"}
        ${Operation === "none" ? "hidden" : "block"}
        `}
        onClick={() => {
          setSelectedFile(null);
          setOperation("none");
          setSecretCode("");
          setWidth(0);
        }}
      >
        <div className=" items-center flex w-fit   justify-start gap-x-1  cursor-pointer hover:duration-300 hover:opacity-80 ">
          <ArrowLeft className=" h-4 w-4  " />
          Back
        </div>
      </CardFooter>
    </Card>
  );
};

export default ShareFile;
