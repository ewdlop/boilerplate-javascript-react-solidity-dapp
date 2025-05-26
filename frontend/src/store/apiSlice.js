import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_URL = 'http://localhost:3000';

export const tokenApi = createApi({
  reducerPath: 'tokenApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  tagTypes: ['Token', 'Contract', 'Allowance', 'TokenInfo'],
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
      invalidatesTags: ['Contract', 'Token', 'TokenInfo'],
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
    approveTokens: builder.mutation({
      query: (approvalData) => ({
        url: '/approve',
        method: 'POST',
        body: approvalData,
      }),
      invalidatesTags: (result, error, { owner, spender }) => [
        { type: 'Allowance', id: `${owner}-${spender}` },
        { type: 'Token', id: owner },
      ],
    }),
    getAllowance: builder.query({
      query: ({ owner, spender }) => `/allowance/${owner}/${spender}`,
      transformResponse: (response) => response.allowance,
      providesTags: (result, error, { owner, spender }) => [
        { type: 'Allowance', id: `${owner}-${spender}` }
      ],
    }),
    getTotalSupply: builder.query({
      query: () => '/total-supply',
      transformResponse: (response) => response.totalSupply,
      providesTags: ['TokenInfo'],
    }),
    getTokenInfo: builder.query({
      query: () => '/token-info',
      providesTags: ['TokenInfo'],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useTransferTokensMutation,
  useGetContractInfoQuery,
  useDeployContractMutation,
  useApproveTokensMutation,
  useGetAllowanceQuery,
  useGetTotalSupplyQuery,
  useGetTokenInfoQuery,
} = tokenApi; 