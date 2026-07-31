from pyteal import *

def approval_program():
    """
    Algorand Smart Contract Approval Program (PyTeal)
    """
    handle_creation = Seq([
        App.globalPut(Bytes("Counter"), Int(0)),
        Approve()
    ])

    handle_increment = Seq([
        App.globalPut(Bytes("Counter"), App.globalGet(Bytes("Counter")) + Int(1)),
        Approve()
    ])

    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.NoOp, handle_increment]
    )

    return program

def clear_state_program():
    return Approve()

if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        f.write(compileTeal(approval_program(), mode=Mode.Application, version=8))
    with open("clear.teal", "w") as f:
        f.write(compileTeal(clear_state_program(), mode=Mode.Application, version=8))
    print("[AlgoKit Build] Compiled approval.teal & clear.teal bytecode successfully!")
