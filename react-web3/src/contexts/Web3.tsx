import Web3 from "web3"
import BN from "bn.js"
import React from 'react'
import { 
    useReducer, 
    createContext,
    useContext,
    useEffect,
    useMemo } from 'react'
import { subscribeToAccount } from '../api/web3'

// define state store
interface State {
    account: string;
    web3: Web3 | null;
}

// define init state
const INITIAL_STATE: State = {
    account: "",
    web3: null
}

// define actions
const UPDATE_ACCOUNT = "UPDATE_ACCOUNT";
interface UpdateAccount {
    type: "UPDATE_ACCOUNT";
    account: string;
    web3?: Web3;
}

type Action = UpdateAccount;

// define reducer
function reducer(state: State = INITIAL_STATE, action: Action) {
    switch (action.type) {
        case UPDATE_ACCOUNT: {

            // set web3 to web3 from the action or from the state
            const web3 = action.web3 || state.web3;
            // extract new account from the action
            const { account } = action;
            // then update the state
            return {
                ...state,
                web3,
                account, 
            }
        }
        default:
            return state; 
        
    }
}

// define web3 context what other components will have access to
const Web3Context = createContext({
    state: INITIAL_STATE,
    updateAccount: (_data: { account: string; web3?: Web3 }) => {}
})

// with this export function other react components will have access
export function useWeb3Context() {
    return useContext(Web3Context);
}

// interface provider props
interface ProviderProps {}

export const Provider: React.FC<ProviderProps> = ({children}) => {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    function updateAccount(data: { account: string; web3?: Web3 }) {
        dispatch({
            type: UPDATE_ACCOUNT,
            ...data
        });
    }

        return (
            <Web3Context.Provider
                value={useMemo(
                    () => ({
                        state,
                        updateAccount,
                    }),
                    [state]
                )}
                >
                { children }
            </Web3Context.Provider>
        )
}

// define the update to reload webpage when account changes
export function Updater() {
    const { state } = useWeb3Context()

    useEffect(() => {
        if(state.web3) {
            const unsubscribe = subscribeToAccount(
                state.web3,
                (error, account) => {
                    if(error) {
                        console.log(error)
                    }
                    if (account !== undefined && account !== state.account) {
                        window.location.reload()
                    }
                })

                return unsubscribe;
        }
    }, [state.web3, state.account])

    return null;
}