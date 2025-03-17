# NZ Business Listings

A directory of New Zealand businesses hosted at business.nataliegwinters.com.

## Setup

1. Ensure you have Node.js and Python installed
2. Activate the virtual environment:
   ```bash
   source .venv/Scripts/activate  # Windows
   source .venv/bin/activate      # Unix/MacOS
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

The site will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

- `src/app`: Next.js app router pages and layouts
- `src/components`: Reusable React components
- `src/lib`: Utility functions and business logic
- `public`: Static assets # Trigger new build
