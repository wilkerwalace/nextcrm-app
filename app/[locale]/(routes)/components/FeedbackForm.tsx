"use client";

import * as z from "zod";
import { useState } from "react";
import { sendFeedback } from "@/actions/feedback/send-feedback";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";

import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Icons } from "@/components/ui/icons";

const formSchema = z.object({
  feedback: z.string().min(1, {
    message: "O feedback deve ter pelo menos 1 caractere.",
  }),
});

interface FeedbackFormProps {
  setOpen: (open: boolean) => void;
}

const FeedbackForm = ({ setOpen }: FeedbackFormProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const result = await sendFeedback({ feedback: data.feedback });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Obrigado pelo seu feedback.");
        setOpen(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Algo deu errado. Por favor, tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="feedback"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Envie-nos um feedback</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Seu feedback"
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-muted-foreground">
                Agradecemos cada feedback. Obrigado por nos ajudar a melhorar
                este aplicativo
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button
            variant={"outline"}
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" variant={"secondary"} disabled={loading}>
            {loading ? (
              <div className="flex space-x-2">
                <Icons.spinner className="h-4 w-4 animate-spin" />
                <span>Enviando ...</span>
              </div>
            ) : (
              "Enviar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FeedbackForm;
