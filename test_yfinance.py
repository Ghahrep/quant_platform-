import yfinance as yf

print("Attempting to download data for AAPL...")
try:
    # Attempt to download 1 year of data for Apple
    aapl_data = yf.download("AAPL", period="1y")

    if not aapl_data.empty:
        print("\n✅ SUCCESS! Data downloaded successfully.")
        print("Here is the latest data:")
        print(aapl_data.tail(3))
    else:
        print("\n❌ FAILED! The download completed but returned no data.")

except Exception as e:
    print(f"\n❌ FAILED! An error occurred during download: {e}")