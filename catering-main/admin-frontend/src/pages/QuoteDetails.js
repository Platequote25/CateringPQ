import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentStep } from '../redux/slices/customerSlice';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const QuoteDetails = () => {
  const { catererID } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { 
    quote, 
    selectedItems, 
    guestCount, 
    totalCost, 
    perPlateCost, 
    discount,
    catererInfo
  } = useSelector(state => state.customer);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle proceed to booking
  const handleProceedToBooking = () => {
    if (!quote) {
      toast.error('Please get a quote first');
      navigate(`/customer/${catererID}/customize`);
      return;
    }
    
    dispatch(setCurrentStep('booking'));
    navigate(`/customer/${catererID}/booking`);
  };
  
  // Handle download quote as PDF
  const handleDownloadQuote = () => {
    if (!quote) {
      toast.error('Quote information is not available');
      return;
    }
    
    const doc = new jsPDF();
    
    // Add caterer info
    doc.setFontSize(20);
    doc.text(`${catererInfo?.businessName || 'Catering Service'} - Quote`, 15, 20);
    
    doc.setFontSize(12);
    doc.text(`Quote ID: ${quote.quoteId || 'N/A'}`, 15, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 38);
    doc.text(`Valid Until: ${quote.validUntil ? formatDate(quote.validUntil) : 'N/A'}`, 15, 46);
    
    // Customer details
    doc.text('Event Details:', 15, 60);
    doc.text(`Guest Count: ${guestCount}`, 20, 68);
    doc.text(`Event Date: ${quote.eventDate ? formatDate(quote.eventDate) : 'N/A'}`, 20, 76);
    
    // Items table
    const tableColumn = ["Item", "Quantity", "Price", "Total"];
    const tableRows = [];
    
    selectedItems.forEach(item => {
      const itemData = [
        item.name,
        item.quantity,
        formatCurrency(item.price),
        formatCurrency(item.price * item.quantity)
      ];
      tableRows.push(itemData);
    });
    
    // Fix: Use the correct autoTable syntax for jsPDF v2.5.1
    import('jspdf-autotable').then(() => {
      doc.autoTable({
        startY: 85,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [66, 135, 245] }
      });
      
      // Summary
      const finalY = doc.lastAutoTable.finalY + 10;
      
      if (discount > 0) {
        doc.text(`Subtotal: ${formatCurrency(totalCost / (1 - discount/100))}`, 120, finalY);
        doc.text(`Discount (${discount}%): ${formatCurrency((totalCost / (1 - discount/100)) * (discount/100))}`, 120, finalY + 8);
        doc.text(`Total Cost: ${formatCurrency(totalCost)}`, 120, finalY + 16);
        doc.text(`Cost Per Guest: ${formatCurrency(perPlateCost)}`, 120, finalY + 24);
      } else {
        doc.text(`Total Cost: ${formatCurrency(totalCost)}`, 120, finalY);
        doc.text(`Cost Per Guest: ${formatCurrency(perPlateCost)}`, 120, finalY + 8);
      }
      
      // Terms and conditions
      doc.text('Terms and Conditions:', 15, finalY + 40);
      doc.setFontSize(10);
      doc.text('1. This quote is valid for 7 days from the date of issue.', 20, finalY + 48);
      doc.text('2. A 50% deposit is required to confirm the booking.', 20, finalY + 56);
      doc.text('3. Final guest count must be confirmed at least 7 days before the event.', 20, finalY + 64);
      doc.text('4. Cancellation policy: Full refund if cancelled 30+ days before event,', 20, finalY + 72);
      doc.text('   50% refund if cancelled 14-29 days before, no refund if cancelled less than 14 days before.', 20, finalY + 80);
      
      // Footer
      doc.setFontSize(12);
      doc.text(`Thank you for choosing ${catererInfo?.businessName || 'our catering service'}!`, 15, finalY + 95);
      
      // Save the PDF
      doc.save(`quote_${quote.quoteId || 'catering'}.pdf`);
      
      toast.success('Quote downloaded successfully');
    });
  };
  
  // If no quote is available, redirect to customize page
  if (!quote) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No quote available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please customize your order first to get a quote.
          </p>
          <div className="mt-6">
            <Link
              to={`/customer/${catererID}/customize`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Customize Order
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Quote Details</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Review your catering quote details below.
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadQuote}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="-ml-0.5 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </button>
              </div>
            </div>
            
            {/* Quote ID and validity */}
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Quote ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{quote.quoteId || 'N/A'}</dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {quote.validUntil ? formatDate(quote.validUntil) : '7 days from today'}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Event Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {quote.eventDate ? formatDate(quote.eventDate) : (selectedItems.length > 0 && selectedItems[0].eventDate ? formatDate(selectedItems[0].eventDate) : 'Not specified')}
                  </dd>
                </div>
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Number of Guests</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{guestCount}</dd>
                </div>
              </dl>
            </div>
            
            {/* Selected items */}
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Selected Items</h3>
            </div>
            <div className="border-t border-gray-200">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedItems.map((item) => (
                      <tr key={item.itemId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Cost breakdown */}
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Cost Breakdown</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
              <dl className="sm:divide-y sm:divide-gray-200">
                {discount > 0 && (
                  <>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                        {formatCurrency(totalCost / (1 - discount/100))}
                      </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500">Discount ({discount}%)</dt>
                      <dd className="mt-1 text-sm text-green-600 sm:mt-0 sm:col-span-2 text-right">
                        -{formatCurrency((totalCost / (1 - discount/100)) * (discount/100))}
                      </dd>
                    </div>
                  </>
                )}
                
                {quote.serviceCharge > 0 && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Service Charge ({quote.serviceChargePercent}%)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                      {formatCurrency(quote.serviceCharge)}
                    </dd>
                  </div>
                )}
                
                {quote.deliveryFee > 0 && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Delivery Fee</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                      {formatCurrency(quote.deliveryFee)}
                    </dd>
                  </div>
                )}
                
                {quote.taxAmount > 0 && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Tax ({quote.taxPercent}%)</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                      {formatCurrency(quote.taxAmount)}
                    </dd>
                  </div>
                )}
                
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
                  <dt className="text-sm font-medium text-gray-900">Total Cost</dt>
                  <dd className="mt-1 text-lg font-bold text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {formatCurrency(totalCost)}
                  </dd>
                </div>
                
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Cost Per Guest</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 text-right">
                    {formatCurrency(perPlateCost)}
                  </dd>
                </div>
              </dl>
            </div>
            
            {/* Terms and conditions */}
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Terms and Conditions</h3>
              <div className="mt-4 text-sm text-gray-600">
                <ul className="list-disc pl-5 space-y-2">
                  <li>This quote is valid for 7 days from the date of issue.</li>
                  <li>A 50% deposit is required to confirm the booking.</li>
                  <li>Final guest count must be confirmed at least 7 days before the event.</li>
                  <li>
                    Cancellation policy: Full refund if cancelled 30+ days before event, 
                    50% refund if cancelled 14-29 days before, no refund if cancelled less than 14 days before.
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between">
              <Link
                to={`/customer/${catererID}/customize`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Modify Order
              </Link>
              <button
                type="button"
                onClick={handleProceedToBooking}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Proceed to Booking
                <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetails; 