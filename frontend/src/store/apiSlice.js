import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = 'http://localhost:3000';

export const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['Token', 'Contract'],
  endpoints: (builder) => ({
    getContractInfo: builder.query({
      query: () => '/contract-info',
      providesTags: ['Contract'],
    }),
    deployContract: builder.mutation({
      query: () => ({
        url: '/deploy',
        method: 'POST',
      }),
      invalidatesTags: ['Contract', 'Token'],
    }),
    getBalance: builder.query({
      query: (address) => `/balance/${address}`,
      transformResponse: (response) => response.balance,
      providesTags: (result, error, address) => [{ type: 'Token', id: address }],
    }),
    transferTokens: builder.mutation({
      query: (transferData) => ({
        url: '/transfer',
        method: 'POST',
        body: transferData,
      }),
      invalidatesTags: (result, error, { from, to }) => [
        { type: 'Token', id: from },
        { type: 'Token', id: to },
      ],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useTransferTokensMutation,
  useGetContractInfoQuery,
  useDeployContractMutation,
} = tokenApi; 