"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UploadCloud, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const leaveSchema = z
  .object({
    fromDate: z.string().min(1, "From date is required"),
    toDate: z.string().min(1, "To date is required"),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason must be under 1000 characters"),
  })
  .refine((data) => data.toDate >= data.fromDate, {
    message: "To date cannot be before from date",
    path: ["toDate"],
  });

type LeaveFormValues = z.infer<typeof leaveSchema>;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface LeaveRecord {
  id: string;
  fromDate: string;
  toDate: string;
  reason: string;
  attachmentUrl?: string | null;
}

interface LeaveFormProps {
  /** Pass an existing leave record to switch the form into edit mode */
  initialData?: LeaveRecord;
  /** Called after a successful create/update, e.g. to close a modal or refresh a list */
  onSuccess?: (leave: LeaveRecord) => void;
  /** Called when the user cancels */
  onCancel?: () => void;
}

const MAX_FILE_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg"];

export default function LeaveForm({
  initialData,
  onSuccess,
  onCancel,
}: LeaveFormProps) {
  const isEditMode = Boolean(initialData?.id);

  const form = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      fromDate: initialData?.fromDate ?? "",
      toDate: initialData?.toDate ?? "",
      reason: initialData?.reason ?? "",
    },
  });

  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.attachmentUrl ?? null,
  );
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const objectUrlRef = useRef<string | null>(null);

  // Reset the form whenever the record we're editing changes
  useEffect(() => {
    form.reset({
      fromDate: initialData?.fromDate ?? "",
      toDate: initialData?.toDate ?? "",
      reason: initialData?.reason ?? "",
    });
    setPreviewUrl(initialData?.attachmentUrl ?? null);
    setImage(null);
    setRemoveExistingImage(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData?.id]);

  // Clean up any object URL we created for a local file preview
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function handleFileChange(file: File | null) {
    if (!file) {
      setImage(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only JPG, JPEG, and PNG files are allowed");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;

    setImage(file);
    setPreviewUrl(url);
    setRemoveExistingImage(false);
  }

  function handleRemoveImage() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImage(null);
    setPreviewUrl(null);
    if (initialData?.attachmentUrl) {
      setRemoveExistingImage(true);
    }
  }

  // Uses XMLHttpRequest instead of fetch so we can report upload progress
  function submitWithProgress(
    url: string,
    method: "POST" | "PUT",
    formData: FormData,
  ) {
    return new Promise<LeaveRecord>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Received an invalid response from the server"));
          }
        } else {
          try {
            const body = JSON.parse(xhr.responseText);
            reject(new Error(body.message || "Something went wrong"));
          } catch {
            reject(new Error("Something went wrong"));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error, please try again"));

      xhr.send(formData);
    });
  }

  async function onSubmit(values: LeaveFormValues) {
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("fromDate", values.fromDate);
      formData.append("toDate", values.toDate);
      formData.append("reason", values.reason);

      if (image) {
        formData.append("attachment", image);
      }
      if (removeExistingImage) {
        formData.append("removeAttachment", "true");
      }

      const url = isEditMode ? `/api/leaves/${initialData!.id}` : "/api/leaves";
      const method = isEditMode ? "PUT" : "POST";

      const result = await submitWithProgress(url, method, formData);

      toast.success(
        isEditMode ? "Leave request updated" : "Leave request submitted",
      );

      onSuccess?.(result);

      if (!isEditMode) {
        form.reset({ fromDate: "", toDate: "", reason: "" });
        handleRemoveImage();
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit leave request",
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  }

  const fromDate = form.watch("fromDate");

  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {isEditMode ? "Edit Leave Request" : "Apply Leave"}
          </CardTitle>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fromDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="toDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>To Date</FormLabel>
                      <FormControl>
                        <Input type="date" min={fromDate} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Write your leave reason..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attachment */}
              <div className="space-y-2">
                <FormLabel>Attachment (Optional)</FormLabel>

                {!previewUrl && (
                  <label
                    htmlFor="attachment"
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:bg-muted/50 transition"
                  >
                    <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="font-medium">Click to upload image</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG, JPEG &middot; up to {MAX_FILE_SIZE_MB}MB
                    </p>
                    <Input
                      id="attachment"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}

                {previewUrl && (
                  <div className="rounded-md border p-3 space-y-3">
                    <div className="flex items-start gap-4">
                      <img
                        src={previewUrl}
                        alt="Attachment preview"
                        className="h-24 w-24 rounded-md object-cover border"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {image ? image.name : "Current attachment"}
                        </p>
                        {image && (
                          <p className="text-xs text-muted-foreground">
                            {(image.size / 1024).toFixed(1)} KB
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={handleRemoveImage}
                        aria-label="Remove attachment"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Update Leave" : "Submit Leave"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </div>
  );
}
