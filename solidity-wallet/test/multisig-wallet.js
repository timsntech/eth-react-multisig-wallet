const { assert } = require('chai')
const chai = require('chai')
chai.use(require('chai-as-promised'))

const expect = chai.expect

const MultiSigWallet = artifacts.require("MultiSigWallet")

contract("MultiSigWallet", accounts => {
    const owners = [accounts[0], accounts[1], accounts[2]]
    const NUM_CONFIRMATIONS_REQUIRED = 2


    let wallet
    beforeEach(async () => {
        wallet = await MultiSigWallet.new(owners, NUM_CONFIRMATIONS_REQUIRED)
    })


    describe("executeTransaction", () => {
        beforeEach(async () => {
            const to = owners[0]
            const value = 0
            const data = "0x0"
        
            await wallet.submitTransaction(to, value, data)
            await wallet.confirmTransaction(0, {from: owners[0]})
            await wallet.confirmTransaction(0, {from: owners[1]})
        })
    
        // execute tx should succeed
        it("should execute", async () => {
    
            const res = await wallet.executeTransaction(0, { from: owners[0] })
            const { logs } = res
            
            assert.equal(logs[0].event, "ExecuteTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)
    
            const tx = await wallet.getTransaction(0)
            assert.equal(tx.executed, true)
        })
    
        // execute tx should fail if already executed
        it("should reject if already executed", async () => {
            await wallet.executeTransaction(0, {from: owners[0]})
            
            await expect(
                wallet.confirmTransaction(0, {from: owners[0]})
            ).to.be.rejected
            
            
            // longer way to write the reject part

            //     try {
            //         await wallet.confirmTransaction(0, {from: owners[0]})
            //         throw new Error("tx did not fail")
            //     } catch (error) {
            //         assert.equal(error.reason, "tx already executed")
            //     }
        })
    })

    // test tx submit
    describe("submitTransaction", () => {
            const to = accounts[3]
            const value = 0
            const data = "0x0123"

        it("should submit tx", async () => {
            const {logs} = await wallet.submitTransaction(to, value, data, {from: owners[0]})

            assert.equal(logs[0].event, "SubmitTransaction"),
            assert.equal(logs[0].args.owner, owners[0]),
            assert.equal(logs[0].args.txIndex, 0),
            assert.equal(logs[0].args.to, to),
            assert.equal(logs[0].args.value, value),
            assert.equal(logs[0].args.data, data),
            assert.equal(await wallet.getTransactionCount(), 1)

            const tx = await wallet.getTransaction(0)
            assert.equal(tx.to, to)
            assert.equal(tx.value, value)
            assert.equal(tx.data, data)
            assert.equal(tx.numConfirmations, 0)
            assert.equal(tx.executed, false)
        })

        it("should reject if not owner", async () => {
          await expect(
              wallet.submitTransaction(to, value, data, {from: accounts[3]})
          ).to.be.rejected
        })
    })


    // test tx confirmation
    describe("confirmTransaction", () => {
        beforeEach(async () => {
            const to = accounts[3]
            const value = 0
            const data = "0x0123"

            await wallet.submitTransaction(to, value, data)
        })

        it("should confirm tx", async () => {
            const {logs} = await wallet.confirmTransaction(0, {from: owners[0]})

            assert.equal(logs[0].event, "ConfirmTransaction")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)

            const tx = await wallet.getTransaction(0)
            assert.equal(tx.numConfirmations, 1)
        })

        it("should reject if not owner", async () => {
            await expect(
                wallet.confirmTransaction(0, {from: accounts[3]})
            ).to.be.rejected
        })

        it("should reject if tx does not exist", async () => {
            await expect(
                wallet.confirmTransaction(1, {from: owners[0]})
            ).to.be.rejected
        })

        it("should reject if tx already confirmed", async () => {
            await wallet.confirmTransaction(0, {from: owners[0]})
            await expect(
                wallet.confirmTransaction(0, {from: owners[0]})
            ).to.be.rejected
        })
    })
    
    // test revoke confirmation
    describe("revokeConfirmation", async () => {
        beforeEach(async () => {
            const to = accounts[3]
            const value = 0
            const data = "0x0"
      
            await wallet.submitTransaction(to, value, data)
            await wallet.confirmTransaction(0, { from: owners[0] })
          })

          it("should revoke confirmation", async () => {
            const { logs } = await wallet.revokeConfirmation(0, {
              from: owners[0],
            })
      
            assert.equal(logs[0].event, "RevokeConfirmation")
            assert.equal(logs[0].args.owner, owners[0])
            assert.equal(logs[0].args.txIndex, 0)
      
            assert.equal(await wallet.isConfirmed(0, owners[0]), false)
      
            const tx = await wallet.getTransaction(0)
            assert.equal(tx.numConfirmations, 0)
          })

        it("should reject if not owner", async () => {
            await expect(
                wallet.revokeConfirmation(0, {from: accounts[3]})
            ).to.be.rejected
        })

        it("should reject if tx does not exist", async () => {
           await expect(
               wallet.revokeConfirmation(1, {from: owners[0]})
           ).to.be.rejected
        })
    })
    
})