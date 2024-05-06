"use client";

import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import axios from "axios";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function RecieveFile() {
  const [enteredCode, setEnteredCode] = useState(null);
  const [loader, setloader] = useState(false);
  const { toast } = useToast();

  const handleDownloadFile = async ({ url, name }) => {
    try {
      const blob = new Blob([url]);
      const dataUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = dataUrl;
      link.setAttribute("download", name || "new file");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setEnteredCode(null);
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to download the file",
      });
    }
  };

  const handleSecretCodeSubmit = async (e) => {
    e.preventDefault();

    if (!enteredCode) return;
    if (enteredCode.length != 6)
      return toast({
        variant: "destructive",
        description: `Code should ${
          enteredCode.length < 6 ? "be" : "not exceed"
        }  6 digit`,
      });

    if (!/^[0-9]*$/.test(enteredCode!))
      return toast({
        variant: "destructive",
        description: "Only numbers allowed",
      });

    setloader(true);
    try {
      const res = await axios.post("/api/validate", { enteredCode });
      const {
        error,
        file: { url, name },
        message,
      } = res.data;
      if (error) {
        return toast({
          variant: "destructive",
          description: message,
        });
      }

      if (url) {
        handleDownloadFile({ url, name });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Failed to download the file",
      });
    } finally {
      setloader(false);
    }
  };

  return (
    <Card className="w-[350px]   shadow-lg shadow-black dark:border-slate-500">
      <CardHeader>
        <CardTitle>Recieve a File</CardTitle>
      </CardHeader>
      <CardFooter className="flex justify-center mt-5">
        <form className="flex w-full max-w-sm items-center space-x-2">
          <Input
            onChange={(e) => setEnteredCode(e.target.value)}
            value={enteredCode == null ? "" : enteredCode}
            type="text"
            placeholder="Enter 6 digit code"
            className=" border-slate-500 focus:border-transparent placeholder:font-normal tracking-wide placeholder:text-gray-500"
          />

          <Button
            type="submit"
            onClick={handleSecretCodeSubmit}
            className=" gap-x-2 flex items-center"
          >
            {loader ? (
              <h1 className=" h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></h1>
            ) : (
              <>
                <span>Download</span>
                <Download className=" h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
