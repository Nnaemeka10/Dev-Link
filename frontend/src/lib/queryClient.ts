import { QueryCache, QueryClient } from "@tanstack/react-query"
import toast from "react-hot-toast"

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
        const errorMessage = query.meta?.errorMessage as string;
        toast.error(errorMessage);
    },
  }),
})