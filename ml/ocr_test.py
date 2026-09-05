import warnings
warnings.filterwarnings('ignore')
import os
os.environ["PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK"] = "True"
os.environ["DNNL_VERBOSE"] = "0"
os.environ["MKLDNN_VERBOSE"] = "0"

import paddle
paddle.set_flags({"FLAGS_use_mkldnn": False})

from paddleocr import PaddleOCR
ocr = PaddleOCR(lang='fr')
result = ocr.ocr(r'C:\Users\21694\Desktop\erap_project\frontend\public\electricite.png')
for line in result:
    if line:
        for item in line:
            print(item[1][0])
