
import sys
print("SYS.PATH:", sys.path)
try:
    import torch
    print("TORCH:", torch)
    print("TORCH FILE:", torch.__file__)
    import torch.nn
    print("TORCH.NN imported successfully")
except Exception as e:
    print("ERROR:", e)
